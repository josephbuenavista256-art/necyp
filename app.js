// ==========================================
// CONFIGURATION & INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://nbcuzewrgdfdaiowbovc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xVZvbjf4t0vRSZCWluJlag_VAURlr6h";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let isAdmin = false;

// Helper to handle and display database errors transparently
function handleDbResponse(error, successMessage, callback) {
    if (error) {
        console.error("Database Error Details:", error);
        alert(`❌ Database Operation Failed: ${error.message || error.details}\n\nPlease check your Supabase RLS (Row Level Security) policies for this table.`);
    } else {
        if (successMessage) alert(`✅ ${successMessage}`);
        if (callback) callback();
    }
}

// ==========================================
// CORE NAVIGATION & PERMISSIONS
// ==========================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
    
    // Update active state navigation highlighting
    document.querySelectorAll('[data-tab]').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('bg-white/10', 'text-white', 'border-l-4', 'border-amber-500');
            btn.classList.remove('text-stone-400');
        } else {
            btn.classList.remove('bg-white/10', 'text-white', 'border-l-4', 'border-amber-500');
            btn.classList.add('text-stone-400');
        }
    });

    fetchData(tabName);
}

function toggleViewMode(asGuest) {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    isAdmin = !asGuest;
    
    const roleBadge = document.getElementById('user-role-badge');
    if (isAdmin) {
        roleBadge.innerText = "Admin Mode Active";
        roleBadge.className = "block text-[10px] bg-amber-500/20 border border-amber-500/40 py-2 px-3 rounded-md text-center mb-2 font-bold tracking-widest text-amber-400 uppercase";
    } else {
        roleBadge.innerText = "Member View (Read-Only)";
        roleBadge.className = "block text-[10px] bg-white/5 border border-white/10 py-2 px-3 rounded-md text-center mb-2 font-bold tracking-widest text-stone-400 uppercase";
    }
    
    applyPermissions();
    switchTab('announcements');
}

function applyPermissions() {
    document.querySelectorAll('.admin-only').forEach(el => {
        if (isAdmin) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

// ==========================================
// AUTHENTICATION SYSTEM
// ==========================================
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert("Please fill in both email and password fields.");
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Invalid login details: " + error.message);
    } else {
        toggleViewMode(false);
    }
}

function logout() {
    supabaseClient.auth.signOut();
    isAdmin = false;
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
    
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
}

// ==========================================
// FETCH DATA & RENDERER ENGINE
// ==========================================
async function fetchData(tab) {
    // 1. ANNOUNCEMENTS
    if (tab === 'announcements') {
        let { data, error } = await supabaseClient.from('announcements').select('*').order('created_at', { ascending: false });
        let container = document.getElementById('announcements-list');
        
        if (error) console.error(error);
        container.innerHTML = data?.map(item => `
            <div class="premium-card border-l-4 border-amber-500 flex justify-between items-start gap-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-white tracking-wide">${item.title}</h3>
                    <p class="text-stone-300 mt-2 text-base leading-relaxed">${item.content}</p>
                </div>
                <div class="admin-only flex gap-3 ml-auto shrink-0">
                    <button onclick="openEditModal('announcement', ${item.id}, \`${item.title.replace(/"/g, '&quot;')}\`, \`${item.content.replace(/"/g, '&quot;')}\`)" class="btn-edit">Edit</button>
                    <button onclick="deleteData('announcements', ${item.id})" class="btn-delete">Remove</button>
                </div>
            </div>`).join('') || '<p class="text-stone-400 italic">No announcements posted yet.</p>';
    }

    // 2. WEEKLY LAYOUT SCHEDULES
    if (tab === 'schedule') {
        const selectedSunday = document.getElementById('sunday-filter').value;
        let { data, error } = await supabaseClient.from('monthly_schedules').select('*').eq('sunday_week', selectedSunday);
        let container = document.getElementById('schedule-container');
        
        if (error) console.error(error);

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-stone-400 italic">No configuration timeline layout assigned for <b>${selectedSunday}</b>.</p>
                    <button onclick="setupCustomSunday('${selectedSunday}')" class="admin-only mt-4 bg-amber-500 text-stone-950 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10 cursor-pointer">+ Create a Template for this Week</button>
                </div>
            `;
            applyPermissions();
            return;
        }

        let sched = data[0];
        container.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-white/10 pb-4 mb-6">
                <div class="flex-1">
                    <h3 class="text-2xl font-bold text-amber-400 tracking-wide">${sched.sunday_week} Configuration</h3>
                    <div class="bg-amber-500/5 p-4 italic text-amber-200 rounded-xl my-3 border border-amber-500/20 max-w-2xl text-base leading-relaxed">
                        <span class="font-bold uppercase tracking-wider text-xs block text-amber-500 mb-1">Weekly Verse Highlight</span>
                        "${sched.verse || 'No verse assigned.'}"
                    </div>
                </div>
                <button onclick="deleteData('monthly_schedules', ${sched.id})" class="admin-only bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0">Remove Entire Layout</button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-stone-200 bg-white/5 p-6 rounded-xl border border-white/5 mb-6">
                <div class="p-3 bg-black/20 rounded-lg"><span class="block text-xs uppercase tracking-wider text-stone-400 mb-0.5">🎤 Worship Leader</span><strong class="text-white">${sched.worship_leader || 'Unassigned'}</strong></div>
                <div class="p-3 bg-black/20 rounded-lg"><span class="block text-xs uppercase tracking-wider text-stone-400 mb-0.5">🎶 Back-up Singers</span><strong class="text-white">${sched.backup_singers || 'Unassigned'}</strong></div>
                <div class="p-3 bg-black/20 rounded-lg"><span class="block text-xs uppercase tracking-wider text-stone-400 mb-0.5">🎸 Guitarist</span><strong class="text-white">${sched.guitar || 'Unassigned'}</strong></div>
                <div class="p-3 bg-black/20 rounded-lg"><span class="block text-xs uppercase tracking-wider text-stone-400 mb-0.5">🎸 Bass Guitarist</span><strong class="text-white">${sched.bass || 'Unassigned'}</strong></div>
                <div class="p-3 bg-black/20 rounded-lg"><span class="block text-xs uppercase tracking-wider text-stone-400 mb-0.5">🥁 Drummer</span><strong class="text-white">${sched.drummer || 'Unassigned'}</strong></div>
                <div class="p-3 bg-black/20 rounded-lg"><span class="block text-xs uppercase tracking-wider text-stone-400 mb-0.5">🎹 Keyboardist</span><strong class="text-white">${sched.keyboard || 'Unassigned'}</strong></div>
                <div class="p-3 bg-black/20 rounded-lg sm:col-span-2 md:col-span-3"><span class="block text-xs uppercase tracking-wider text-stone-400 mb-0.5">💻 Multimedia / Lyrics Operator</span><strong class="text-white">${sched.multimedia || 'Unassigned'}</strong></div>
            </div>
            <button onclick="openEditScheduleModal(${sched.id}, \`${sched.sunday_week}\`, \`${(sched.verse || '').replace(/"/g, '&quot;')}\`, \`${(sched.worship_leader || '').replace(/"/g, '&quot;')}\`, \`${(sched.backup_singers || '').replace(/"/g, '&quot;')}\`, \`${(sched.guitar || '').replace(/"/g, '&quot;')}\`, \`${(sched.bass || '').replace(/"/g, '&quot;')}\`, \`${(sched.drummer || '').replace(/"/g, '&quot;')}\`, \`${(sched.keyboard || '').replace(/"/g, '&quot;')}\`, \`${(sched.multimedia || '').replace(/"/g, '&quot;')}\`)" class="admin-only bg-amber-500 hover:bg-amber-400 text-stone-950 px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-amber-500/10 transition-all cursor-pointer">✏️ Edit Line-up Details</button>
        `;
    }

    // 3. CHURCH OFFICERS
    if (tab === 'officers-list') {
        let { data, error } = await supabaseClient.from('church_officers').select('*').order('created_at', { ascending: true });
        let container = document.getElementById('officers-grid');
        
        if (error) console.error(error);
        container.innerHTML = data?.map(item => `
            <div class="premium-card flex flex-col items-center text-center group border border-white/10 hover:border-amber-500/40 transition-all">
                <div class="w-28 h-28 overflow-hidden border-2 border-amber-500/30 rounded-full mb-3 shadow-inner bg-stone-900 shrink-0">
                    <img src="${item.image_url || 'https://via.placeholder.com/200?text=No+Photo'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Officer">
                </div>
                <h3 class="font-bold text-lg text-white tracking-wide">${item.name}</h3>
                <p class="text-amber-400 font-medium text-xs uppercase tracking-wider mt-1">${item.position}</p>
                <div class="admin-only mt-4 flex gap-3 justify-center w-full border-t border-white/10 pt-3">
                    <button onclick="openEditOfficerModal(${item.id}, '${item.name}', '${item.position}', '${item.image_url || ''}')" class="btn-edit text-xs">Edit</button>
                    <button onclick="deleteData('church_officers', ${item.id})" class="btn-delete text-xs">Remove</button>
                </div>
            </div>`).join('') || '<p class="text-stone-400 italic">No ministry leaders registered.</p>';
    }

    // 4. OFFICERS MEETINGS & PLANS
    if (tab === 'officers-meetings') {
        let { data, error } = await supabaseClient.from('officer_plans').select('*').order('meeting_date', { ascending: false });
        let container = document.getElementById('meetings-list');
        
        if (error) console.error(error);
        container.innerHTML = data?.map(item => `
            <div class="premium-card flex justify-between items-start gap-4 border border-white/5 hover:border-white/10">
                <div class="flex-1">
                    <span class="inline-block bg-white/5 border border-white/10 text-stone-300 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider mb-2">📅 Date: ${item.meeting_date}</span>
                    <h3 class="text-xl font-bold text-white tracking-wide">${item.title}</h3>
                    <p class="text-stone-300 mt-2 text-sm leading-relaxed">${item.description || 'No descriptive items specified.'}</p>
                </div>
                <div class="admin-only flex gap-3 ml-auto shrink-0">
                    <button onclick="openEditMeetingModal(${item.id}, \`${item.title.replace(/"/g, '&quot;')}\`, '${item.meeting_date}', \`${(item.description || '').replace(/"/g, '&quot;')}\`)" class="btn-edit">Edit</button>
                    <button onclick="deleteData('officer_plans', ${item.id})" class="btn-delete">Remove</button>
                </div>
            </div>`).join('') || '<p class="text-stone-400 italic">No scheduled meetings found.</p>';
    }

    // 5. PISO A DAY
    if (tab === 'piso-day') {
        let { data, error } = await supabaseClient.from('piso_a_day').select('*').order('date_recorded', { ascending: false });
        if (error) console.error(error);
        
        document.getElementById('piso-table-body').innerHTML = data?.map(item => `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="p-4 pl-6 font-medium text-white">${item.member_name}</td>
                <td class="p-4 text-emerald-400 font-bold tracking-wide">₱${item.amount.toLocaleString()}</td>
                <td class="p-4 text-stone-400 text-sm">${item.date_recorded}</td>
                <td class="admin-only p-4 text-center">
                    <div class="flex gap-3 justify-center">
                        <button onclick="openEditPisoModal(${item.id}, \`${item.member_name.replace(/"/g, '&quot;')}\`, ${item.amount}, '${item.date_recorded}')" class="btn-edit text-xs">Edit</button>
                        <button onclick="deleteData('piso_a_day', ${item.id})" class="btn-delete text-xs">Remove</button>
                    </div>
                </td>
            </tr>`).join('') || '<tr><td colspan="4" class="p-8 text-center text-stone-400 italic">No record entry ledgers found.</td></tr>';
    }

    // 6. EVENT SUGGESTIONS & VOTE POLLS
    if (tab === 'polls') {
        let { data, error } = await supabaseClient.from('event_polls').select('*').order('created_at', { ascending: false });
        let container = document.getElementById('polls-list');
        
        if (error) console.error(error);
        container.innerHTML = data?.map(item => `
            <div class="premium-card flex flex-col justify-between text-center border border-white/10 hover:border-white/20 transition-all">
                <div>
                    <h3 class="text-xl font-bold text-white tracking-wide">${item.event_name}</h3>
                    <p class="text-stone-300 text-sm mt-2 leading-relaxed">${item.description || 'No timeline description added.'}</p>
                </div>
                <div class="mt-4 bg-white/5 border border-white/10 p-4 rounded-xl">
                    <span class="block text-3xl font-black text-amber-400 tracking-tight">${item.votes}</span>
                    <span class="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1 block">Total Verified Votes</span>
                </div>
                <div class="mt-4 flex flex-col gap-2">
                    <button onclick="voteEvent(${item.id}, ${item.votes})" class="w-full bg-amber-500 text-stone-950 py-2.5 rounded-lg text-xs hover:bg-amber-400 font-bold transition-all uppercase tracking-wider shadow-md">👍 Agree / cast vote</button>
                    <div class="admin-only flex justify-center gap-3 mt-3 border-t border-white/10 pt-2 w-full">
                        <button onclick="openEditPollModal(${item.id}, \`${item.event_name.replace(/"/g, '&quot;')}\`, \`${(item.description || '').replace(/"/g, '&quot;')}\`)" class="btn-edit text-xs">Edit</button>
                        <button onclick="deleteData('event_polls', ${item.id})" class="btn-delete text-xs">Remove</button>
                    </div>
                </div>
            </div>`).join('') || '<p class="text-stone-400 italic">No open community planning polls active.</p>';
    }

    // 7. CHURCH FUNDS
    if (tab === 'funds') {
        let { data, error } = await supabaseClient.from('church_funds').select('*').order('date_recorded', { ascending: false });
        if (error) console.error(error);
        
        document.getElementById('funds-table-body').innerHTML = data?.map(item => `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="p-4 pl-6 font-semibold text-white"><span class="inline-block px-2.5 py-0.5 text-xs rounded font-medium bg-stone-800 text-amber-300 border border-white/5">${item.type}</span></td>
                <td class="p-4 text-emerald-400 font-bold tracking-wide">₱${item.amount.toLocaleString()}</td>
                <td class="p-4 text-stone-400 text-sm">${item.date_recorded}</td>
                <td class="p-4 text-stone-300 text-sm italic">${item.remarks || '—'}</td>
                <td class="admin-only p-4 text-center">
                    <div class="flex gap-3 justify-center">
                        <button onclick="openEditFundModal(${item.id}, '${item.type}', ${item.amount}, '${item.date_recorded}', \`${(item.remarks || '').replace(/"/g, '&quot;')}\`)" class="btn-edit text-xs">Edit</button>
                        <button onclick="deleteData('church_funds', ${item.id})" class="btn-delete text-xs">Remove</button>
                    </div>
                </td>
            </tr>`).join('') || '<tr><td colspan="5" class="p-8 text-center text-stone-400 italic">No financial database logs registered.</td></tr>';
    }
    
    applyPermissions();
}

// ==========================================
// OPERATIONAL ENGINES (VOTE, SYSTEM, DELETE)
// ==========================================
async function deleteData(table, id) {
    if (!isAdmin) {
        alert("Access Denied: Only logged-in administrators can delete data.");
        return;
    }
    if (confirm("Are you sure you want to remove or delete this permanently from the database?")) {
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        
        let targetTab = table === 'piso_a_day' ? 'piso-day' : 
                        (table === 'officer_plans' ? 'officers-meetings' : 
                        (table === 'church_officers' ? 'officers-list' : 
                        (table === 'monthly_schedules' ? 'schedule' : 
                        (table === 'event_polls' ? 'polls' : 
                        (table === 'church_funds' ? 'funds' : table)))));

        handleDbResponse(error, "Record successfully removed!", () => {
            fetchData(targetTab);
        });
    }
}

async function voteEvent(id, currentVotes) {
    const { error } = await supabaseClient.from('event_polls').update({ votes: currentVotes + 1 }).eq('id', id);
    handleDbResponse(error, null, () => {
        fetchData('polls');
    });
}

async function setupCustomSunday(weekName) {
    if (!isAdmin) {
        alert("Access Denied: Only logged-in administrators can create layouts.");
        return;
    }
    const { error } = await supabaseClient.from('monthly_schedules').insert([{ 
        sunday_week: weekName, 
        verse: "Psalm 104:33 - I will sing to the Lord as long as I live...", 
        worship_leader: "", backup_singers: "", guitar: "", bass: "", drummer: "", keyboard: "", multimedia: "" 
    }]);

    handleDbResponse(error, "Template initialized successfully!", () => {
        fetchData('schedule');
    });
}

// ==========================================
// MODAL ENGINE (OPEN & CLOSE)
// ==========================================
function closeModal() {
    document.getElementById('generic-modal').classList.add('hidden');
    document.getElementById('modal-fields').innerHTML = '';
}

function openModal(mode) {
    if (!isAdmin) {
        alert("Access Denied: Only logged-in administrators can modify content.");
        return;
    }
    const modal = document.getElementById('generic-modal');
    const fields = document.getElementById('modal-fields');
    modal.classList.remove('hidden');

    const inputClass = "w-full p-3 border border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-stone-900 text-white placeholder-stone-500 text-sm transition-all";

    if (mode === 'announcement') {
        document.getElementById('modal-title').innerText = "Create New Announcement";
        fields.innerHTML = `
            <input type="text" id="f-title" placeholder="Announcement Title" class="${inputClass}">
            <textarea id="f-content" placeholder="Details and instructions..." rows="4" class="${inputClass}"></textarea>`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            const { error } = await supabaseClient.from('announcements').insert([{ 
                title: document.getElementById('f-title').value, 
                content: document.getElementById('f-content').value 
            }]);
            handleDbResponse(error, "Announcement created successfully!", () => {
                closeModal(); 
                fetchData('announcements');
            });
        };
    }
    
    if (mode === 'officer-rep') {
        document.getElementById('modal-title').innerText = "Add Church Officer / Leader";
        fields.innerHTML = `
            <input type="text" id="f-off-name" placeholder="Full Name" class="${inputClass}">
            <input type="text" id="f-off-pos" placeholder="Position (e.g., Pastor, Deacon, Elder)" class="${inputClass}">
            <input type="text" id="f-off-img" placeholder="2x2 Image URL (Optional)" class="${inputClass}">`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            const { error } = await supabaseClient.from('church_officers').insert([{ 
                name: document.getElementById('f-off-name').value, 
                position: document.getElementById('f-off-pos').value, 
                image_url: document.getElementById('f-off-img').value 
            }]);
            handleDbResponse(error, "Officer added successfully!", () => {
                closeModal(); 
                fetchData('officers-list');
            });
        };
    }

    if (mode === 'meeting') {
        document.getElementById('modal-title').innerText = "Add Meeting / Plan Record";
        fields.innerHTML = `
            <input type="text" id="f-meet-title" placeholder="Agenda Title" class="${inputClass}">
            <input type="date" id="f-meet-date" class="${inputClass}">
            <textarea id="f-meet-desc" placeholder="Agenda and timeline notes..." rows="3" class="${inputClass}"></textarea>`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            const { error } = await supabaseClient.from('officer_plans').insert([{ 
                title: document.getElementById('f-meet-title').value, 
                meeting_date: document.getElementById('f-meet-date').value, 
                description: document.getElementById('f-meet-desc').value 
            }]);
            handleDbResponse(error, "Meeting plan saved!", () => {
                closeModal(); 
                fetchData('officers-meetings');
            });
        };
    }

    if (mode === 'piso') {
        document.getElementById('modal-title').innerText = "Record Piso A Day Collection";
        fields.innerHTML = `
            <input type="text" id="f-piso-name" placeholder="Congregation Member Name" class="${inputClass}">
            <input type="number" id="f-piso-amt" placeholder="Amount (₱)" class="${inputClass}">
            <input type="date" id="f-piso-date" class="${inputClass}">`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            const { error } = await supabaseClient.from('piso_a_day').insert([{ 
                member_name: document.getElementById('f-piso-name').value, 
                amount: parseFloat(document.getElementById('f-piso-amt').value || 0), 
                date_recorded: document.getElementById('f-piso-date').value 
            }]);
            handleDbResponse(error, "Piso record saved to database!", () => {
                closeModal(); 
                fetchData('piso-day');
            });
        };
    }

    if (mode === 'poll') {
        document.getElementById('modal-title').innerText = "Propose New Event Suggestion";
        fields.innerHTML = `
            <input type="text" id="f-poll-name" placeholder="Proposed Activity / Event Name" class="${inputClass}">
            <textarea id="f-poll-desc" placeholder="Brief rationale or explanation..." rows="3" class="${inputClass}"></textarea>`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            const { error } = await supabaseClient.from('event_polls').insert([{ 
                event_name: document.getElementById('f-poll-name').value, 
                description: document.getElementById('f-poll-desc').value,
                votes: 0
            }]);
            handleDbResponse(error, "Event suggestion published!", () => {
                closeModal(); 
                fetchData('polls');
            });
        };
    }

    if (mode === 'fund') {
        document.getElementById('modal-title').innerText = "Log Financial Ledger Transaction";
        fields.innerHTML = `
            <select id="f-fund-type" class="${inputClass}">
                <option value="Tithes">Tithes</option>
                <option value="Offering">Regular Offering</option>
                <option value="Donation">Special Donation</option>
                <option value="Expense">Expense/Outflow</option>
            </select>
            <input type="number" id="f-fund-amt" placeholder="Transaction Amount (₱)" class="${inputClass}">
            <input type="date" id="f-fund-date" class="${inputClass}">
            <input type="text" id="f-fund-rem" placeholder="Remarks, reference, or specifications" class="${inputClass}">`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            const { error } = await supabaseClient.from('church_funds').insert([{ 
                type: document.getElementById('f-fund-type').value, 
                amount: parseFloat(document.getElementById('f-fund-amt').value || 0), 
                date_recorded: document.getElementById('f-fund-date').value,
                remarks: document.getElementById('f-fund-rem').value
            }]);
            handleDbResponse(error, "Transaction logged transparently!", () => {
                closeModal(); 
                fetchData('funds');
            });
        };
    }
}

// ==========================================
// DYNAMIC EDIT OVERLAY MODAL SETUPS
// ==========================================
function openEditModal(mode, id, oldTitle, oldContent) {
    openModal(mode);
    document.getElementById('modal-title').innerText = "Update Announcement";
    document.getElementById('f-title').value = oldTitle;
    document.getElementById('f-content').value = oldContent;
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('announcements').update({ 
            title: document.getElementById('f-title').value, 
            content: document.getElementById('f-content').value 
        }).eq('id', id);
        handleDbResponse(error, "Announcement updated cleanly!", () => {
            closeModal(); 
            fetchData('announcements');
        });
    };
}

function openEditScheduleModal(id, currentSunday, verse, wl, backup, guitar, bass, drummer, keyboard, multimedia) {
    if (!isAdmin) return alert("Admin login required.");
    const modal = document.getElementById('generic-modal');
    const fields = document.getElementById('modal-fields');
    modal.classList.remove('hidden');
    document.getElementById('modal-title').innerText = `Update ${currentSunday} Line-up`;

    const inputClass = "w-full p-2 border border-stone-700 rounded-lg bg-stone-900 text-white placeholder-stone-500 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500";
    
    fields.innerHTML = `
        <div><label class="text-[10px] text-stone-400 font-bold block mb-1">Weekly Verse Highlight</label><input type="text" id="e-verse" class="${inputClass}" value="${verse}"></div>
        <div><label class="text-[10px] text-stone-400 font-bold block mb-1">Worship Leader</label><input type="text" id="e-wl" class="${inputClass}" value="${wl}"></div>
        <div><label class="text-[10px] text-stone-400 font-bold block mb-1">Backup Singers</label><input type="text" id="e-backup" class="${inputClass}" value="${backup}"></div>
        <div><label class="text-[10px] text-stone-400 font-bold block mb-1">Guitarist</label><input type="text" id="e-guitar" class="${inputClass}" value="${guitar}"></div>
        <div><label class="text-[10px] text-stone-400 font-bold block mb-1">Bass Player</label><input type="text" id="e-bass" class="${inputClass}" value="${bass}"></div>
        <div><label class="text-[10px] text-stone-400 font-bold block mb-1">Drummer</label><input type="text" id="e-drum" class="${inputClass}" value="${drummer}"></div>
        <div><label class="text-[10px] text-stone-400 font-bold block mb-1">Keyboardist</label><input type="text" id="e-key" class="${inputClass}" value="${keyboard}"></div>
        <div><label class="text-[10px] text-stone-400 font-bold block mb-1">Multimedia Operator</label><input type="text" id="e-multi" class="${inputClass}" value="${multimedia}"></div>
    `;

    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('monthly_schedules').update({
            verse: document.getElementById('e-verse').value,
            worship_leader: document.getElementById('e-wl').value,
            backup_singers: document.getElementById('e-backup').value,
            guitar: document.getElementById('e-guitar').value,
            bass: document.getElementById('e-bass').value,
            drummer: document.getElementById('e-drum').value,
            keyboard: document.getElementById('e-key').value,
            multimedia: document.getElementById('e-multi').value
        }).eq('id', id);

        handleDbResponse(error, "Praise team timeline updated directly!", () => {
            closeModal();
            fetchData('schedule');
        });
    };
}

function openEditOfficerModal(id, oldName, oldPos, oldImg) {
    openModal('officer-rep');
    document.getElementById('modal-title').innerText = "Edit Church Officer";
    document.getElementById('f-off-name').value = oldName;
    document.getElementById('f-off-pos').value = oldPos;
    document.getElementById('f-off-img').value = oldImg;
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('church_officers').update({ 
            name: document.getElementById('f-off-name').value, 
            position: document.getElementById('f-off-pos').value, 
            image_url: document.getElementById('f-off-img').value 
        }).eq('id', id);
        handleDbResponse(error, "Officer configuration saved!", () => {
            closeModal(); 
            fetchData('officers-list');
        });
    };
}

function openEditMeetingModal(id, oldTitle, oldDate, oldDesc) {
    openModal('meeting');
    document.getElementById('modal-title').innerText = "Edit Meeting Agenda";
    document.getElementById('f-meet-title').value = oldTitle;
    document.getElementById('f-meet-date').value = oldDate;
    document.getElementById('f-meet-desc').value = oldDesc;
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('officer_plans').update({ 
            title: document.getElementById('f-meet-title').value, 
            meeting_date: document.getElementById('f-meet-date').value, 
            description: document.getElementById('f-meet-desc').value 
        }).eq('id', id);
        handleDbResponse(error, "Meeting adjustments finalized!", () => {
            closeModal(); 
            fetchData('officers-meetings');
        });
    };
}

function openEditPisoModal(id, oldName, oldAmt, oldDate) {
    openModal('piso');
    document.getElementById('modal-title').innerText = "Edit Piso Record";
    document.getElementById('f-piso-name').value = oldName;
    document.getElementById('f-piso-amt').value = oldAmt;
    document.getElementById('f-piso-date').value = oldDate;
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('piso_a_day').update({ 
            member_name: document.getElementById('f-piso-name').value, 
            amount: parseFloat(document.getElementById('f-piso-amt').value || 0), 
            date_recorded: document.getElementById('f-piso-date').value 
        }).eq('id', id);
        handleDbResponse(error, "Piso ledger row updated successfully!", () => {
            closeModal(); 
            fetchData('piso-day');
        });
    };
}

function openEditPollModal(id, oldName, oldDesc) {
    openModal('poll');
    document.getElementById('modal-title').innerText = "Edit Event Suggestion";
    document.getElementById('f-poll-name').value = oldName;
    document.getElementById('f-poll-desc').value = oldDesc;
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('event_polls').update({ 
            event_name: document.getElementById('f-poll-name').value, 
            description: document.getElementById('f-poll-desc').value 
        }).eq('id', id);
        handleDbResponse(error, "Poll criteria altered cleanly!", () => {
            closeModal(); 
            fetchData('polls');
        });
    };
}

function openEditFundModal(id, oldType, oldAmt, oldDate, oldRem) {
    openModal('fund');
    document.getElementById('modal-title').innerText = "Edit Fund Transaction";
    document.getElementById('f-fund-type').value = oldType;
    document.getElementById('f-fund-amt').value = oldAmt;
    document.getElementById('f-fund-date').value = oldDate;
    document.getElementById('f-fund-rem').value = oldRem;
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('church_funds').update({ 
            type: document.getElementById('f-fund-type').value, 
            amount: parseFloat(document.getElementById('f-fund-amt').value || 0), 
            date_recorded: document.getElementById('f-fund-date').value, 
            remarks: document.getElementById('f-fund-rem').value 
        }).eq('id', id);
        handleDbResponse(error, "Financial history adjustment synced!", () => {
            closeModal(); 
            fetchData('funds');
        });
    };
}

// ==========================================
// BIND ALL FUNCTIONS TO GLOBAL WINDOW OBJECT
// ==========================================
window.switchTab = switchTab;
window.toggleViewMode = toggleViewMode;
window.applyPermissions = applyPermissions;
window.login = login;
window.logout = logout;
window.fetchData = fetchData;
window.deleteData = deleteData;
window.voteEvent = voteEvent;
window.setupCustomSunday = setupCustomSunday;
window.closeModal = closeModal;
window.openModal = openModal;
window.openEditModal = openEditModal;
window.openEditScheduleModal = openEditScheduleModal;
window.openEditOfficerModal = openEditOfficerModal;
window.openEditMeetingModal = openEditMeetingModal;
window.openEditPisoModal = openEditPisoModal;
window.openEditPollModal = openEditPollModal;
window.openEditFundModal = openEditFundModal;

document.addEventListener('DOMContentLoaded', () => {
    applyPermissions();
});
