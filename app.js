// ==========================================
// CONFIGURATION & INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://nbcuzewrgdfdaiowbovc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xVZvbjf4t0vRSZCWluJlag_VAURlr6h";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let isAdmin = false;

// ==========================================
// CORE NAVIGATION & PERMISSIONS
// ==========================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
    
    // Manage tab button state highlights
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${tabName}'`)) {
            btn.classList.add('bg-white/10', 'text-white', 'border-white/10');
        } else {
            btn.classList.remove('bg-white/10', 'text-white', 'border-white/10');
        }
    });

    fetchData(tabName);
}

function toggleViewMode(asGuest) {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    isAdmin = !asGuest;
    
    const badge = document.getElementById('user-role-badge');
    if (isAdmin) {
        badge.innerText = "Admin Mode Active";
        badge.classList.remove('bg-blue-500/10', 'text-blue-400', 'border-blue-500/20');
        badge.classList.add('bg-amber-500/10', 'text-amber-400', 'border-amber-500/20');
    } else {
        badge.innerText = "Member View (Read-Only)";
        badge.classList.remove('bg-amber-500/10', 'text-amber-400', 'border-amber-500/20');
        badge.classList.add('bg-blue-500/10', 'text-blue-400', 'border-blue-500/20');
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
        let { data } = await supabaseClient.from('announcements').select('*').order('created_at', { ascending: false });
        let container = document.getElementById('announcements-list');
        
        container.innerHTML = data?.map(item => `
            <div class="flex flex-col sm:flex-row justify-between items-start gap-4 border-l-4 border-blue-500">
                <div class="flex-1">
                    <h3>${item.title}</h3>
                    <p class="mt-2">${item.content}</p>
                </div>
                <div class="admin-only flex gap-4 sm:self-start sm:ml-auto pt-1">
                    <button onclick="openEditModal('announcement', ${item.id}, \`${item.title.replace(/'/g, "\\'")}\`, \`${item.content.replace(/'/g, "\\'")}\`)" class="text-sm font-semibold hover:underline">Edit</button>
                    <button onclick="deleteData('announcements', ${item.id})" class="text-sm font-semibold hover:underline">Remove</button>
                </div>
            </div>`).join('') || '<p class="text-slate-400 italic">No announcements posted yet.</p>';
    }

    // 2. SEPARATED SUNDAY SCHEDULES (WITH UNLIMITED DYNAMIC INLINE LAYOUT EDITOR IMPLEMENTATION)
    if (tab === 'schedule') {
        const selectedSunday = document.getElementById('sunday-filter').value;
        let { data } = await supabaseClient.from('monthly_schedules').select('*').eq('sunday_week', selectedSunday);
        let container = document.getElementById('schedule-container');
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-slate-400 italic text-lg">No lineup configuration assigned for <b>${selectedSunday}</b>.</p>
                    <button onclick="setupCustomSunday('${selectedSunday}')" class="admin-only mt-4 bg-white text-slate-950 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all cursor-pointer">+ Initialize Layout Template</button>
                </div>
            `;
            applyPermissions();
            return;
        }

        let sched = data[0];
        container.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-white/10 pb-4 mb-6">
                <div class="flex-1">
                    <h3 class="text-2xl font-bold text-white">${sched.sunday_week} Configuration Matrix</h3>
                    <div class="bg-white/5 border border-white/10 p-4 italic text-slate-200 rounded-xl mt-3 border-l-4 border-blue-500/70">
                        <span class="block font-sans uppercase tracking-widest text-[10px] text-blue-400 font-bold not-italic mb-1">Weekly Call Theme / Scripture</span>
                        "${sched.verse || ''}"
                    </div>
                </div>
                <button onclick="deleteData('monthly_schedules', ${sched.id})" class="admin-only bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer self-end">Remove Layout</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-200 font-sans mb-6">
                <div class="bg-slate-950/40 p-4 border border-white/5 rounded-xl"><span class="text-slate-400 text-sm block mb-0.5">🎤 Worship Leader</span><strong class="text-base text-white font-serif">${sched.worship_leader || 'Unassigned'}</strong></div>
                <div class="bg-slate-950/40 p-4 border border-white/5 rounded-xl"><span class="text-slate-400 text-sm block mb-0.5">🎶 Back-up Singers</span><strong class="text-base text-white font-serif">${sched.backup_singers || 'Unassigned'}</strong></div>
                <div class="bg-slate-950/40 p-4 border border-white/5 rounded-xl"><span class="text-slate-400 text-sm block mb-0.5">🎸 Lead/Rhythm Guitar</span><strong class="text-base text-white font-serif">${sched.guitar || 'Unassigned'}</strong></div>
                <div class="bg-slate-950/40 p-4 border border-white/5 rounded-xl"><span class="text-slate-400 text-sm block mb-0.5">🎸 Bass Guitarist</span><strong class="text-base text-white font-serif">${sched.bass || 'Unassigned'}</strong></div>
                <div class="bg-slate-950/40 p-4 border border-white/5 rounded-xl"><span class="text-slate-400 text-sm block mb-0.5">🥁 Percussionist / Drums</span><strong class="text-base text-white font-serif">${sched.drummer || 'Unassigned'}</strong></div>
                <div class="bg-slate-950/40 p-4 border border-white/5 rounded-xl"><span class="text-slate-400 text-sm block mb-0.5">🎹 Keyboardist</span><strong class="text-base text-white font-serif">${sched.keyboard || 'Unassigned'}</strong></div>
                <div class="bg-slate-950/40 p-4 border border-white/5 rounded-xl md:col-span-2"><span class="text-slate-400 text-sm block mb-0.5">💻 Multimedia Pro / Lyrics Pro Operator</span><strong class="text-base text-white font-serif">${sched.multimedia || 'Unassigned'}</strong></div>
            </div>
            <button onclick="openEditScheduleModal(${sched.id}, \`${sched.sunday_week}\`, \`${(sched.verse || '').replace(/'/g, "\\'")}\`, \`${(sched.worship_leader || '').replace(/'/g, "\\'")}\`, \`${(sched.backup_singers || '').replace(/'/g, "\\'")}\`, \`${(sched.guitar || '').replace(/'/g, "\\'")}\`, \`${(sched.bass || '').replace(/'/g, "\\'")}\`, \`${(sched.drummer || '').replace(/'/g, "\\'")}\`, \`${(sched.keyboard || '').replace(/'/g, "\\'")}\`, \`${(sched.multimedia || '').replace(/'/g, "\\'")}\`)" class="admin-only w-full sm:w-auto bg-white text-slate-950 px-6 py-3 rounded-xl text-sm font-bold shadow hover:bg-slate-100 transition-all cursor-pointer font-sans">✏️ Modify Line-Up Variables</button>
        `;
    }

    // 3. CHURCH OFFICERS
    if (tab === 'officers-list') {
        let { data } = await supabaseClient.from('church_officers').select('*').order('created_at', { ascending: true });
        let container = document.getElementById('officers-grid');
        
        container.innerHTML = data?.map(item => `
            <div class="relative group">
                <div class="w-28 h-28 mx-auto overflow-hidden rounded-full border-2 border-blue-600/50 shadow-lg bg-slate-100">
                    <img src="${item.image_url || 'https://via.placeholder.com/200?text=Officer'}" class="w-full h-full object-cover" alt="Officer Avatar">
                </div>
                <h3>${item.name}</h3>
                <p>${item.position}</p>
                <div class="admin-only mt-4 flex gap-4 justify-center w-full border-t border-slate-200/60 pt-2 font-sans">
                    <button onclick="openEditOfficerModal(${item.id}, \`${item.name.replace(/'/g, "\\'")}\`, \`${item.position.replace(/'/g, "\\'")}\`, \`${(item.image_url || '').replace(/'/g, "\\'")}\`)" class="text-xs font-bold hover:underline">Edit</button>
                    <button onclick="deleteData('church_officers', ${item.id})" class="text-xs font-bold hover:underline">Remove</button>
                </div>
            </div>`).join('') || '<p class="text-slate-400 italic col-span-full text-center py-4">No leadership profiles listed.</p>';
    }

    // 4. OFFICERS MEETINGS & PLANS
    if (tab === 'officers-meetings') {
        let { data } = await supabaseClient.from('officer_plans').select('*').order('meeting_date', { ascending: false });
        let container = document.getElementById('meetings-list');
        
        container.innerHTML = data?.map(item => `
            <div class="flex flex-col justify-between h-full">
                <div>
                    <h3>${item.title}</h3>
                    <p class="text-sm text-slate-300 font-sans font-semibold mt-1 flex items-center gap-1.5">
                        <span class="inline-block w-2 h-2 rounded-full bg-blue-400"></span> Scheduled: ${item.meeting_date}
                    </p>
                    <p class="mt-3 text-slate-200 font-serif border-t border-white/5 pt-2">${item.description || 'No descriptive items registered.'}</p>
                </div>
                <div class="admin-only flex gap-4 mt-5 border-t border-white/10 pt-3 font-sans justify-end">
                    <button onclick="openEditMeetingModal(${item.id}, \`${item.title.replace(/'/g, "\\'")}\`, \`${item.meeting_date}\`, \`${(item.description || '').replace(/'/g, "\\'")}\`)" class="text-sm font-bold hover:underline">Edit</button>
                    <button onclick="deleteData('officer_plans', ${item.id})" class="text-sm font-bold hover:underline">Remove</button>
                </div>
            </div>`).join('') || '<p class="text-slate-400 italic col-span-full text-center py-4">No sessions scheduled.</p>';
    }

    // 5. PISO A DAY
    if (tab === 'piso-day') {
        let { data } = await supabaseClient.from('piso_a_day').select('*').order('date_recorded', { ascending: false });
        document.getElementById('piso-table-body').innerHTML = data?.map(item => `
            <tr class="border-b border-white/5 transition-colors">
                <td class="p-4 pl-6 text-white font-medium">${item.member_name}</td>
                <td class="p-4 text-green-400 font-bold font-sans">₱${parseFloat(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td class="p-4 text-slate-300 font-sans">${item.date_recorded}</td>
                <td class="admin-only p-4 text-center">
                    <div class="flex gap-4 justify-center font-sans">
                        <button onclick="openEditPisoModal(${item.id}, \`${item.member_name.replace(/'/g, "\\'")}\`, ${item.amount}, '${item.date_recorded}')" class="text-xs font-semibold hover:underline">Edit</button>
                        <button onclick="deleteData('piso_a_day', ${item.id})" class="text-xs font-semibold hover:underline">Remove</button>
                    </div>
                </td>
            </tr>`).join('') || '<tr><td colspan="4" class="p-8 text-center text-slate-400 italic">No historical data records found.</td></tr>';
    }

    // 6. EVENT SUGGESTIONS & VOTE POLLS
    if (tab === 'polls') {
        let { data } = await supabaseClient.from('event_polls').select('*').order('created_at', { ascending: false });
        let container = document.getElementById('polls-list');
        
        container.innerHTML = data?.map(item => `
            <div class="flex flex-col justify-between h-full bg-slate-900/60 border border-white/10 p-5 rounded-xl">
                <div>
                    <h3>${item.event_name}</h3>
                    <p class="text-slate-300 text-sm mt-2 font-serif">${item.description || 'No descriptive profile details assigned.'}</p>
                </div>
                <div>
                    <div class="my-4 bg-slate-950/60 p-3.5 border border-white/5 rounded-xl text-center">
                        <span class="block text-3xl font-black text-blue-400 font-sans">${item.votes}</span>
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-sans">Aggregated Votes</span>
                    </div>
                    <div class="flex flex-col gap-2 font-sans">
                        <button onclick="voteEvent(${item.id}, ${item.votes})" class="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer tracking-wider uppercase active:scale-[0.98]">👍 Register Vote</button>
                        <div class="admin-only flex justify-center gap-4 mt-2 border-t border-white/5 pt-2 w-full text-xs">
                            <button onclick="openEditPollModal(${item.id}, \`${item.event_name.replace(/'/g, "\\'")}\`, \`${(item.description || '').replace(/'/g, "\\'")}\`)" class="font-bold hover:underline">Edit</button>
                            <button onclick="deleteData('event_polls', ${item.id})" class="font-bold hover:underline">Remove</button>
                        </div>
                    </div>
                </div>
            </div>`).join('') || '<p class="text-slate-400 italic col-span-full text-center py-4">No community ideas suggested yet.</p>';
    }

    // 7. CHURCH FUNDS
    if (tab === 'funds') {
        let { data } = await supabaseClient.from('church_funds').select('*').order('date_recorded', { ascending: false });
        document.getElementById('funds-table-body').innerHTML = data?.map(item => `
            <tr class="border-b border-white/5 transition-colors">
                <td class="p-4 pl-6 font-bold text-slate-100">${item.type}</td>
                <td class="p-4 ${item.type === 'Expense' ? 'text-rose-400' : 'text-green-400'} font-bold font-sans">₱${parseFloat(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td class="p-4 text-slate-300 font-sans">${item.date_recorded}</td>
                <td class="p-4 text-slate-200 font-serif max-w-xs truncate">${item.remarks || ''}</td>
                <td class="admin-only p-4 text-center">
                    <div class="flex gap-4 justify-center font-sans">
                        <button onclick="openEditFundModal(${item.id}, '${item.type}', ${item.amount}, '${item.date_recorded}', \`${(item.remarks || '').replace(/'/g, "\\'")}\`)" class="text-xs font-semibold hover:underline">Edit</button>
                        <button onclick="deleteData('church_funds', ${item.id})" class="text-xs font-semibold hover:underline">Remove</button>
                    </div>
                </td>
            </tr>`).join('') || '<tr><td colspan="5" class="p-8 text-center text-slate-400 italic">No financial ledger rows found.</td></tr>';
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
    if (confirm("Are you sure you want to remove or delete this permanently?")) {
        await supabaseClient.from(table).delete().eq('id', id);
        alert("Record successfully removed!");
        
        let targetTab = table === 'piso_a_day' ? 'piso-day' : 
                        (table === 'officer_plans' ? 'officers-meetings' : 
                        (table === 'church_officers' ? 'officers-list' : 
                        (table === 'monthly_schedules' ? 'schedule' : 
                        (table === 'event_polls' ? 'polls' : 
                        (table === 'church_funds' ? 'funds' : table)))));
        fetchData(targetTab);
    }
}

async function voteEvent(id, currentVotes) {
    await supabaseClient.from('event_polls').update({ votes: currentVotes + 1 }).eq('id', id);
    fetchData('polls');
}

async function setupCustomSunday(weekName) {
    if (!isAdmin) {
        alert("Access Denied: Only logged-in administrators can create layouts.");
        return;
    }
    await supabaseClient.from('monthly_schedules').insert([{ 
        sunday_week: weekName, 
        verse: "Psalm 104:33 - I will sing to the Lord as long as I live...", 
        worship_leader: "", backup_singers: "", guitar: "", bass: "", drummer: "", keyboard: "", multimedia: "" 
    }]);
    fetchData('schedule');
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

    const inputClasses = "w-full p-3 border border-white/10 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 font-sans text-sm";

    if (mode === 'announcement') {
        document.getElementById('modal-title').innerText = "Create New Announcement";
        fields.innerHTML = `
            <input type="text" id="f-title" placeholder="Announcement Heading Title" class="${inputClasses}">
            <textarea id="f-content" placeholder="Write comprehensive announcement content details here..." class="${inputClasses} h-32 resize-none"></textarea>`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            await supabaseClient.from('announcements').insert([{ 
                title: document.getElementById('f-title').value, 
                content: document.getElementById('f-content').value 
            }]);
            closeModal(); 
            fetchData('announcements');
        };
    }
    
    if (mode === 'officer-rep') {
        document.getElementById('modal-title').innerText = "Add Leader Profile";
        fields.innerHTML = `
            <input type="text" id="f-off-name" placeholder="Full Name Identity" class="${inputClasses}">
            <input type="text" id="f-off-pos" placeholder="Official Designation (e.g., Pastor, Youth Leader)" class="${inputClasses}">
            <input type="text" id="f-off-img" placeholder="Profile Image URL (Optional)" class="${inputClasses}">`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            await supabaseClient.from('church_officers').insert([{ 
                name: document.getElementById('f-off-name').value, 
                position: document.getElementById('f-off-pos').value, 
                image_url: document.getElementById('f-off-img').value 
            }]);
            closeModal(); 
            fetchData('officers-list');
        };
    }

    if (mode === 'meeting') {
        document.getElementById('modal-title').innerText = "Schedule New Session";
        fields.innerHTML = `
            <input type="text" id="f-meet-title" placeholder="Session / Meeting Objective Title" class="${inputClasses}">
            <input type="date" id="f-meet-date" class="${inputClasses}">
            <textarea id="f-meet-desc" placeholder="Agenda blueprint items or strategic details..." class="${inputClasses} h-28 resize-none"></textarea>`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            await supabaseClient.from('officer_plans').insert([{ 
                title: document.getElementById('f-meet-title').value, 
                meeting_date: document.getElementById('f-meet-date').value, 
                description: document.getElementById('f-meet-desc').value 
            }]);
            closeModal(); 
            fetchData('officers-meetings');
        };
    }

    if (mode === 'piso') {
        document.getElementById('modal-title').innerText = "Log Member Allocation";
        fields.innerHTML = `
            <input type="text" id="f-piso-name" placeholder="Congregation Member Name" class="${inputClasses}">
            <input type="number" step="0.01" id="f-piso-amt" placeholder="Contribution Amount (₱)" class="${inputClasses}">
            <input type="date" id="f-piso-date" class="${inputClasses}">`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            await supabaseClient.from('piso_a_day').insert([{ 
                member_name: document.getElementById('f-piso-name').value, 
                amount: parseFloat(document.getElementById('f-piso-amt').value), 
                date_recorded: document.getElementById('f-piso-date').value 
            }]);
            closeModal(); 
            fetchData('piso-day');
        };
    }

    if (mode === 'poll') {
        document.getElementById('modal-title').innerText = "Propose Community Concept";
        fields.innerHTML = `
            <input type="text" id="f-poll-name" placeholder="Proposed Event Designation Name" class="${inputClasses}">
            <textarea id="f-poll-desc" placeholder="Brief rationale or summary of proposed activities..." class="${inputClasses} h-24 resize-none"></textarea>`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            await supabaseClient.from('event_polls').insert([{ 
                event_name: document.getElementById('f-poll-name').value, 
                description: document.getElementById('f-poll-desc').value,
                votes: 0
            }]);
            closeModal(); 
            fetchData('polls');
        };
    }

    if (mode === 'fund') {
        document.getElementById('modal-title').innerText = "Record Ledger Log Entry";
        fields.innerHTML = `
            <select id="f-fund-type" class="${inputClasses} bg-slate-900">
                <option value="Tithes">Tithes</option>
                <option value="Offering">Offering</option>
                <option value="Donation">Special Donation</option>
                <option value="Expense">Expense/Outflow</option>
            </select>
            <input type="number" step="0.01" id="f-fund-amt" placeholder="Transaction Amount (₱)" class="${inputClasses}">
            <input type="date" id="f-fund-date" class="${inputClasses}">
            <input type="text" id="f-fund-rem" placeholder="Transaction Remarks / Allocation details" class="${inputClasses}">`;
        
        document.getElementById('modal-save-btn').onclick = async () => {
            await supabaseClient.from('church_funds').insert([{ 
                type: document.getElementById('f-fund-type').value, 
                amount: parseFloat(document.getElementById('f-fund-amt').value), 
                date_recorded: document.getElementById('f-fund-date').value,
                remarks: document.getElementById('f-fund-rem').value
            }]);
            closeModal(); 
            fetchData('funds');
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
        await supabaseClient.from('announcements').update({ 
            title: document.getElementById('f-title').value, 
            content: document.getElementById('f-content').value 
        }).eq('id', id);
        closeModal(); 
        fetchData('announcements');
    };
}

// Full, UNRESTRICTED interactive schedule modal engine mapping implementation
function openEditScheduleModal(id, week, verse, wl, backup, gtr, bass, drum, keyb, multi) {
    if (!isAdmin) return;
    const modal = document.getElementById('generic-modal');
    const fields = document.getElementById('modal-fields');
    modal.classList.remove('hidden');
    document.getElementById('modal-title').innerText = `Edit Lineup Matrix`;
    
    const inputClasses = "w-full p-2.5 border border-white/10 rounded-xl bg-slate-950/50 text-white text-xs font-sans focus:outline-none";
    
    fields.innerHTML = `
        <div><label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Theme / Scripture Verse Context</label><input type="text" id="sched-f-verse" value="${verse}" class="${inputClasses}"></div>
        <div><label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Worship Leader</label><input type="text" id="sched-f-wl" value="${wl}" class="${inputClasses}"></div>
        <div><label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Backup Singers</label><input type="text" id="sched-f-backup" value="${backup}" class="${inputClasses}"></div>
        <div><label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Guitarist</label><input type="text" id="sched-f-gtr" value="${gtr}" class="${inputClasses}"></div>
        <div><label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Bass Player</label><input type="text" id="sched-f-bass" value="${bass}" class="${inputClasses}"></div>
        <div><label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Drummer</label><input type="text" id="sched-f-drum" value="${drum}" class="${inputClasses}"></div>
        <div><label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Keyboardist</label><input type="text" id="sched-f-keyb" value="${keyb}" class="${inputClasses}"></div>
        <div><label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Multimedia Operator</label><input type="text" id="sched-f-multi" value="${multi}" class="${inputClasses}"></div>
    `;

    document.getElementById('modal-save-btn').onclick = async () => {
        await supabaseClient.from('monthly_schedules').update({
            verse: document.getElementById('sched-f-verse').value,
            worship_leader: document.getElementById('sched-f-wl').value,
            backup_singers: document.getElementById('sched-f-backup').value,
            guitar: document.getElementById('sched-f-gtr').value,
            bass: document.getElementById('sched-f-bass').value,
            drummer: document.getElementById('sched-f-drum').value,
            keyboard: document.getElementById('sched-f-keyb').value,
            multimedia: document.getElementById('sched-f-multi').value
        }).eq('id', id);
        closeModal();
        fetchData('schedule');
    };
}

function openEditOfficerModal(id, oldName, oldPos, oldImg) {
    openModal('officer-rep');
    document.getElementById('modal-title').innerText = "Edit Church Officer";
    document.getElementById('f-off-name').value = oldName;
    document.getElementById('f-off-pos').value = oldPos;
    document.getElementById('f-off-img').value = oldImg;
    document.getElementById('modal-save-btn').onclick = async () => {
        await supabaseClient.from('church_officers').update({ 
            name: document.getElementById('f-off-name').value, 
            position: document.getElementById('f-off-pos').value, 
            image_url: document.getElementById('f-off-img').value 
        }).eq('id', id);
        closeModal(); 
        fetchData('officers-list');
    };
}

function openEditMeetingModal(id, oldTitle, oldDate, oldDesc) {
    openModal('meeting');
    document.getElementById('modal-title').innerText = "Edit Meeting Agenda";
    document.getElementById('f-meet-title').value = oldTitle;
    document.getElementById('f-meet-date').value = oldDate;
    document.getElementById('f-meet-desc').value = oldDesc;
    document.getElementById('modal-save-btn').onclick = async () => {
        await supabaseClient.from('officer_plans').update({ 
            title: document.getElementById('f-meet-title').value, 
            meeting_date: document.getElementById('f-meet-date').value, 
            description: document.getElementById('f-meet-desc').value 
        }).eq('id', id);
        closeModal(); 
        fetchData('officers-meetings');
    };
}

function openEditPisoModal(id, oldName, oldAmt, oldDate) {
    openModal('piso');
    document.getElementById('modal-title').innerText = "Edit Piso Record";
    document.getElementById('f-piso-name').value = oldName;
    document.getElementById('f-piso-amt').value = oldAmt;
    document.getElementById('f-piso-date').value = oldDate;
    document.getElementById('modal-save-btn').onclick = async () => {
        await supabaseClient.from('piso_a_day').update({ 
            member_name: document.getElementById('f-piso-name').value, 
            amount: parseFloat(document.getElementById('f-piso-amt').value), 
            date_recorded: document.getElementById('f-piso-date').value 
        }).eq('id', id);
        closeModal(); 
        fetchData('piso-day');
    };
}

function openEditPollModal(id, oldName, oldDesc) {
    openModal('poll');
    document.getElementById('modal-title').innerText = "Edit Event Suggestion";
    document.getElementById('f-poll-name').value = oldName;
    document.getElementById('f-poll-desc').value = oldDesc;
    document.getElementById('modal-save-btn').onclick = async () => {
        await supabaseClient.from('event_polls').update({ 
            event_name: document.getElementById('f-poll-name').value, 
            description: document.getElementById('f-poll-desc').value 
        }).eq('id', id);
        closeModal(); 
        fetchData('polls');
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
        await supabaseClient.from('church_funds').update({ 
            type: document.getElementById('f-fund-type').value, 
            amount: parseFloat(document.getElementById('f-fund-amt').value), 
            date_recorded: document.getElementById('f-fund-date').value, 
            remarks: document.getElementById('f-fund-rem').value 
        }).eq('id', id);
        closeModal(); 
        fetchData('funds');
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
