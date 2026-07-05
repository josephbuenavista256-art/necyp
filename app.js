// ==========================================
// CONFIGURATION & INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://nbcuzewrgdfdaiowbovc.supabase.co/rest/v1/";
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
// CORE NAVIGATION & PERMISSIONS (WITH MOBILE SLIDE)
// ==========================================
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar-panel');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

function switchTab(tabName) {
    const allTabs = document.querySelectorAll('.tab-content');
    
    // Smooth transition pipeline layout
    allTabs.forEach(el => {
        el.classList.remove('tab-active');
        el.classList.add('hidden');
    });

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
        // Force Reflow sequence execution to cleanly reset modern transformations
        void targetTab.offsetWidth; 
        targetTab.classList.add('tab-active');
    }
    
    // Update active state navigation highlighting with luxury sliding styles
    document.querySelectorAll('[data-tab]').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('bg-amber-500/10', 'text-amber-400', 'border-l-4', 'border-amber-500', 'pl-6');
            btn.classList.remove('text-slate-400', 'hover:bg-white/5');
        } else {
            btn.classList.remove('bg-amber-500/10', 'text-amber-400', 'border-l-4', 'border-amber-500', 'pl-6');
            btn.classList.add('text-slate-400', 'hover:bg-white/5');
        }
    });

    // Auto close menu drawer when clicked on mobile layouts
    const sidebar = document.getElementById('sidebar-panel');
    if (!sidebar.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
        toggleMobileSidebar();
    }

    fetchData(tabName);
}

function toggleViewMode(asGuest) {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    isAdmin = !asGuest;
    
    const roleBadge = document.getElementById('user-role-badge');
    if (isAdmin) {
        roleBadge.innerText = "Admin Node Access Authorized";
        roleBadge.className = "block text-[10px] bg-amber-500/10 border border-amber-500/30 py-2.5 px-3 rounded-xl text-center mb-2.5 font-black tracking-widest text-amber-400 uppercase shadow-md shadow-amber-500/5";
    } else {
        roleBadge.innerText = "Member View (Read-Only Mode)";
        roleBadge.className = "block text-[10px] bg-white/5 border border-white/5 py-2.5 px-3 rounded-xl text-center mb-2.5 font-black tracking-widest text-slate-400 uppercase shadow-inner";
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
// SYSTEM ACCESS SECURITY AUTH
// ==========================================
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert("Please completely supply authentication strings.");
        return;
    }

    let response;
    
    // Fallback architecture to automatically handle both Supabase v1 and v2 methods
    if (typeof supabaseClient.auth.signInWithPassword === 'function') {
        response = await supabaseClient.auth.signInWithPassword({ email, password });
    } else if (typeof supabaseClient.auth.signIn === 'function') {
        response = await supabaseClient.auth.signIn({ email, password });
    } else {
        alert("❌ Authentication configuration mismatch. Please verify your Supabase library injection.");
        return;
    }

    const { data, error } = response;
    if (error) {
        alert("Invalid login strings: " + error.message);
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
// FETCH REPOSITORY MODULES & STRUCTURAL RENDERERS
// ==========================================
async function fetchData(tab) {
    // 1. ANNOUNCEMENTS
    if (tab === 'announcements') {
        let { data, error } = await supabaseClient.from('announcements').select('*').order('created_at', { ascending: false });
        let container = document.getElementById('announcements-list');
        
        if (error) console.error(error);
        container.innerHTML = data?.map(item => `
            <div class="premium-card border-l-4 border-amber-500/80 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div class="flex-1">
                    <h3 class="text-xl font-extrabold text-white tracking-wide">${item.title}</h3>
                    <p class="text-slate-300 mt-2.5 text-sm md:text-base leading-relaxed font-medium">${item.content}</p>
                </div>
                <div class="admin-only flex gap-2.5 sm:ml-auto shrink-0 pt-2 sm:pt-0">
                    <button onclick="openEditModal('announcement', ${item.id}, \`${item.title.replace(/"/g, '&quot;')}\`, \`${item.content.replace(/"/g, '&quot;')}\`)" class="btn-edit">Edit</button>
                    <button onclick="deleteData('announcements', ${item.id})" class="btn-delete">Remove</button>
                </div>
            </div>`).join('') || '<div class="premium-card text-center py-6 text-slate-400 italic">No announcements mapped to this relational node.</div>';
    }

    // 2. TIMELINE SCHEDULE METRICS
    if (tab === 'schedule') {
        const selectedSunday = document.getElementById('sunday-filter').value;
        let { data, error } = await supabaseClient.from('monthly_schedules').select('*').eq('sunday_week', selectedSunday);
        let container = document.getElementById('schedule-container');
        
        if (error) console.error(error);

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 premium-card border border-dashed border-white/10">
                    <p class="text-slate-400 italic text-sm">No configuration timeline layout assigned for <b class="text-amber-400">${selectedSunday}</b>.</p>
                    <button onclick="setupCustomSunday('${selectedSunday}')" class="admin-only btn-premium-shimmer text-[#090d16] mt-5 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer uppercase tracking-wider">+ Create Template For This Week</button>
                </div>
            `;
            applyPermissions();
            return;
        }

        let sched = data[0];
        container.innerHTML = `
            <div class="flex flex-col lg:flex-row justify-between items-start gap-4 border-b border-white/5 pb-5 mb-6">
                <div class="flex-1 w-full">
                    <h3 class="text-2xl font-black text-amber-400 tracking-wide">${sched.sunday_week} Configuration Matrix</h3>
                    <div class="bg-amber-500/5 p-4 rounded-xl my-4 border border-amber-500/20 max-w-3xl">
                        <span class="font-black uppercase tracking-widest text-[10px] block text-amber-500 mb-1.5">Weekly Scripture Highlight</span>
                        <p class="text-amber-200/90 italic font-medium text-sm leading-relaxed">"${sched.verse || 'No verse assigned.'}"</p>
                    </div>
                </div>
                <button onclick="deleteData('monthly_schedules', ${sched.id})" class="admin-only bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer tracking-wider uppercase shrink-0 mt-2 lg:mt-0">Drop Configuration Layout</button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-slate-200 bg-black/10 p-5 rounded-2xl border border-white/5 mb-6">
                <div class="p-3.5 bg-[#14192a]/50 rounded-xl border border-white/5"><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-1">🎤 Worship Leader</span><strong class="text-white text-sm font-bold">${sched.worship_leader || 'Unassigned'}</strong></div>
                <div class="p-3.5 bg-[#14192a]/50 rounded-xl border border-white/5"><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-1">🎶 Vocal Array Support</span><strong class="text-white text-sm font-bold">${sched.backup_singers || 'Unassigned'}</strong></div>
                <div class="p-3.5 bg-[#14192a]/50 rounded-xl border border-white/5"><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-1">🎸 Lead Guitarist</span><strong class="text-white text-sm font-bold">${sched.guitar || 'Unassigned'}</strong></div>
                <div class="p-3.5 bg-[#14192a]/50 rounded-xl border border-white/5"><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-1">🎸 Bassist Node</span><strong class="text-white text-sm font-bold">${sched.bass || 'Unassigned'}</strong></div>
                <div class="p-3.5 bg-[#14192a]/50 rounded-xl border border-white/5"><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-1">🥁 Rhythm / Drums</span><strong class="text-white text-sm font-bold">${sched.drummer || 'Unassigned'}</strong></div>
                <div class="p-3.5 bg-[#14192a]/50 rounded-xl border border-white/5"><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-1">🎹 Synthesizer / Keys</span><strong class="text-white text-sm font-bold">${sched.keyboard || 'Unassigned'}</strong></div>
                <div class="p-3.5 bg-[#14192a]/50 rounded-xl border border-white/5 sm:col-span-2 lg:col-span-3"><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-1">💻 Projection / Lyrics Operator</span><strong class="text-white text-sm font-bold">${sched.multimedia || 'Unassigned'}</strong></div>
            </div>
            <button onclick="openEditScheduleModal(${sched.id}, \`${sched.sunday_week}\`, \`${(sched.verse || '').replace(/"/g, '&quot;')}\`, \`${(sched.worship_leader || '').replace(/"/g, '&quot;')}\`, \`${(sched.backup_singers || '').replace(/"/g, '&quot;')}\`, \`${(sched.guitar || '').replace(/"/g, '&quot;')}\`, \`${(sched.bass || '').replace(/"/g, '&quot;')}\`, \`${(sched.drummer || '').replace(/"/g, '&quot;')}\`, \`${(sched.keyboard || '').replace(/"/g, '&quot;')}\`, \`${(sched.multimedia || '').replace(/"/g, '&quot;')}\`)" class="admin-only btn-premium-shimmer text-[#090d16] px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer uppercase tracking-wider">✏️ Mutate Line-up Configuration</button>
        `;
    }

    // 3. CHURCH REPRESENTATIVES
    if (tab === 'officers-list') {
        let { data, error } = await supabaseClient.from('church_officers').select('*').order('created_at', { ascending: true });
        let container = document.getElementById('officers-grid');
        
        if (error) console.error(error);
        container.innerHTML = data?.map(item => `
            <div class="premium-card flex flex-col items-center text-center group transition-all duration-300">
                <div class="w-24 h-24 overflow-hidden border-2 border-amber-500/40 rounded-full mb-3.5 shadow-md bg-slate-900 shrink-0 relative">
                    <img src="${item.image_url || 'https://via.placeholder.com/200?text=No+Photo'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Officer">
                </div>
                <h3 class="font-extrabold text-base tracking-wide line-clamp-1">${item.name}</h3>
                <p class="font-black text-[10px] tracking-widest uppercase mt-1 bg-amber-500/5 px-3 py-0.5 rounded-full">${item.position}</p>
                <div class="admin-only mt-4 flex gap-2 justify-center w-full border-t border-slate-200/60 pt-3">
                    <button onclick="openEditOfficerModal(${item.id}, '${item.name}', '${item.position}', '${item.image_url || ''}')" class="btn-edit text-[10px] px-2.5 py-1.5">Edit</button>
                    <button onclick="deleteData('church_officers', ${item.id})" class="btn-delete text-[10px] px-2.5 py-1.5">Remove</button>
                </div>
            </div>`).join('') || '<div class="premium-card text-center py-6 text-slate-400 italic sm:col-span-2 lg:col-span-4">No executive profiles deployed inside the cluster.</div>';
    }

    // 4. STRATEGIC COUNCIL MEETINGS
    if (tab === 'officers-meetings') {
        let { data, error } = await supabaseClient.from('officer_plans').select('*').order('meeting_date', { ascending: false });
        let container = document.getElementById('meetings-list');
        
        if (error) console.error(error);
        container.innerHTML = data?.map(item => `
            <div class="premium-card flex flex-col justify-between items-start gap-4">
                <div class="w-full">
                    <span class="inline-block bg-white/5 border border-white/10 text-slate-300 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest mb-3 shadow-inner">📅 Node Date: ${item.meeting_date}</span>
                    <h3 class="text-xl font-extrabold text-white tracking-wide">${item.title}</h3>
                    <p class="text-slate-400 mt-2 text-sm leading-relaxed font-medium">${item.description || 'No descriptive logic documentation mapped.'}</p>
                </div>
                <div class="admin-only flex gap-2.5 border-t border-white/5 pt-3.5 w-full justify-end shrink-0">
                    <button onclick="openEditMeetingModal(${item.id}, \`${item.title.replace(/"/g, '&quot;')}\`, '${item.meeting_date}', \`${(item.description || '').replace(/"/g, '&quot;')}\`)" class="btn-edit">Edit</button>
                    <button onclick="deleteData('officer_plans', ${item.id})" class="btn-delete">Remove</button>
                </div>
            </div>`).join('') || '<div class="premium-card text-center py-6 text-slate-400 italic sm:col-span-2">No meeting data vectors recorded.</div>';
    }

    // 5. MICRO-COLLECTION PISO TRACKER
    if (tab === 'piso-day') {
        let { data, error } = await supabaseClient.from('piso_a_day').select('*').order('date_recorded', { ascending: false });
        if (error) console.error(error);
        
        document.getElementById('piso-table-body').innerHTML = data?.map(item => `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors font-medium">
                <td class="p-4 pl-6 text-sm text-white">${item.member_name}</td>
                <td class="p-4 text-emerald-400 font-extrabold tracking-wide text-sm">₱${item.amount.toLocaleString()}</td>
                <td class="p-4 text-slate-400 text-xs tracking-wider">${item.date_recorded}</td>
                <td class="admin-only p-4 text-center">
                    <div class="flex gap-2 justify-center">
                        <button onclick="openEditPisoModal(${item.id}, \`${item.member_name.replace(/"/g, '&quot;')}\`, ${item.amount}, '${item.date_recorded}')" class="btn-edit text-[10px]">Edit</button>
                        <button onclick="deleteData('piso_a_day', ${item.id})" class="btn-delete text-[10px]">Remove</button>
                    </div>
                </td>
            </tr>`).join('') || '<tr><td colspan="4" class="p-8 text-center text-slate-400 italic text-sm font-medium">No ledger lines allocated inside the module.</td></tr>';
    }

    // 6. PROPOSALS & ELECTIONS
    if (tab === 'polls') {
        let { data, error } = await supabaseClient.from('event_polls').select('*').order('created_at', { ascending: false });
        let container = document.getElementById('polls-list');
        
        if (error) console.error(error);
        container.innerHTML = data?.map(item => `
            <div class="premium-card flex flex-col justify-between text-center transition-all">
                <div>
                    <h3 class="text-xl font-extrabold text-white tracking-wide">${item.event_name}</h3>
                    <p class="text-slate-400 text-xs mt-2 leading-relaxed font-medium line-clamp-3">${item.description || 'No concept description supplied.'}</p>
                </div>
                <div>
                    <div class="my-4 bg-black/30 border border-white/5 p-4 rounded-xl shadow-inner group-hover:border-amber-500/10">
                        <span class="block text-4xl font-black text-amber-400 tracking-tighter">${item.votes}</span>
                        <span class="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 block">Verified Assenting Votes</span>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="voteEvent(${item.id}, ${item.votes})" class="w-full bg-[#1e2538] border border-white/10 hover:border-amber-500/30 hover:bg-amber-500 hover:text-[#090d16] text-slate-200 py-2.5 rounded-xl text-xs font-extrabold transition-all uppercase tracking-wider cursor-pointer">👍 Affirm Proposition</button>
                        <div class="admin-only flex justify-center gap-2 mt-2.5 border-t border-white/5 pt-2.5 w-full">
                            <button onclick="openEditPollModal(${item.id}, \`${item.event_name.replace(/"/g, '&quot;')}\`, \`${(item.description || '').replace(/"/g, '&quot;')}\`)" class="btn-edit text-[10px]">Edit</button>
                            <button onclick="deleteData('event_polls', ${item.id})" class="btn-delete text-[10px]">Remove</button>
                        </div>
                    </div>
                </div>
            </div>`).join('') || '<p class="text-slate-400 italic text-sm text-center py-6 sm:col-span-2 lg:col-span-3">No active event layouts proposed.</p>';
    }

    // 7. FINANCIAL ACCOUNTING
    if (tab === 'funds') {
        let { data, error } = await supabaseClient.from('church_funds').select('*').order('date_recorded', { ascending: false });
        if (error) console.error(error);
        
        document.getElementById('funds-table-body').innerHTML = data?.map(item => `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors font-medium">
                <td class="p-4 pl-6 text-xs font-black"><span class="inline-block px-3 py-1 rounded-md bg-[#131724] text-amber-400 border border-white/5 shadow-inner uppercase tracking-wider">${item.type}</span></td>
                <td class="p-4 text-emerald-400 font-extrabold tracking-wide text-sm">₱${item.amount.toLocaleString()}</td>
                <td class="p-4 text-slate-400 text-xs tracking-wider">${item.date_recorded}</td>
                <td class="p-4 text-slate-300 text-xs italic font-normal max-w-xs truncate">${item.remarks || '—'}</td>
                <td class="admin-only p-4 text-center">
                    <div class="flex gap-2 justify-center">
                        <button onclick="openEditFundModal(${item.id}, '${item.type}', ${item.amount}, '${item.date_recorded}', \`${(item.remarks || '').replace(/"/g, '&quot;')}\`)" class="btn-edit text-[10px]">Edit</button>
                        <button onclick="deleteData('church_funds', ${item.id})" class="btn-delete text-[10px]">Remove</button>
                    </div>
                </td>
            </tr>`).join('') || '<tr><td colspan="5" class="p-8 text-center text-slate-400 italic text-sm font-medium">No transparent ledger balance sheets detected.</td></tr>';
    }
    
    applyPermissions();
}

// ==========================================
// SYSTEM OPERATIONAL ACTIONS (VOTE, SYSTEM MUTATION)
// ==========================================
async function deleteData(table, id) {
    if (!isAdmin) {
        alert("Access Denied: Administrative security level required.");
        return;
    }
    if (confirm("Confirm database row drop sequence? This action cannot be reversed.")) {
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        
        let targetTab = table === 'piso_a_day' ? 'piso-day' : 
                        (table === 'officer_plans' ? 'officers-meetings' : 
                        (table === 'church_officers' ? 'officers-list' : 
                        (table === 'monthly_schedules' ? 'schedule' : 
                        (table === 'event_polls' ? 'polls' : 
                        (table === 'church_funds' ? 'funds' : table)))));

        handleDbResponse(error, "Record removed from server nodes.", () => {
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
        alert("Access Denied: Administrative clearance required.");
        return;
    }
    const { error } = await supabaseClient.from('monthly_schedules').insert([{ 
        sunday_week: weekName, 
        verse: "Psalm 100:2 - Worship the Lord with gladness; come before him with joyful songs.", 
        worship_leader: "", backup_singers: "", guitar: "", bass: "", drummer: "", keyboard: "", multimedia: "" 
    }]);

    handleDbResponse(error, "Weekly layout initialized cleanly.", () => {
        fetchData('schedule');
    });
}

// ==========================================
// FORM OVERLAY SYSTEM CONTROLLERS (MODALS)
// ==========================================
function closeModal() {
    document.getElementById('generic-modal').classList.add('hidden');
    document.getElementById('modal-fields').innerHTML = '';
}

function openModal(mode) {
    if (!isAdmin) {
        alert("Access Denied: Missing operational credentials.");
        return;
    }
    const modal = document.getElementById('generic-modal');
    const fields = document.getElementById('modal-fields');
    modal.classList.remove('hidden');

    const inputClass = "w-full p-3.5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 bg-black/20 text-white placeholder-slate-500 text-sm transition-all duration-300";

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
            handleDbResponse(error, "Announcement distributed to network.", () => {
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
            handleDbResponse(error, "Representative profile established.", () => {
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
            handleDbResponse(error, "Council logging synchronized.", () => {
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
            handleDbResponse(error, "Contribution tracked inside ledger nodes.", () => {
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
            handleDbResponse(error, "Proposition deployed to public stream.", () => {
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
            handleDbResponse(error, "Financial matrix balance synchronized.", () => {
                closeModal(); 
                fetchData('funds');
            });
        };
    }
}

// ==========================================
// DYNAMIC COMPONENT UPDATE SYSTEMS (EDITORS)
// ==========================================
function openEditModal(mode, id, oldTitle, oldContent) {
    openModal(mode);
    document.getElementById('modal-title').innerText = "Update Announcement Parameters";
    document.getElementById('f-title').value = oldTitle;
    document.getElementById('f-content').value = oldContent;
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('announcements').update({ 
            title: document.getElementById('f-title').value, 
            content: document.getElementById('f-content').value 
        }).eq('id', id);
        handleDbResponse(error, "Announcement updated cleanly.", () => {
            closeModal(); 
            fetchData('announcements');
        });
    };
}

function openEditScheduleModal(id, currentSunday, verse, wl, backup, guitar, bass, drummer, keyboard, multimedia) {
    if (!isAdmin) return alert("Clearance required.");
    const modal = document.getElementById('generic-modal');
    const fields = document.getElementById('modal-fields');
    modal.classList.remove('hidden');
    document.getElementById('modal-title').innerText = `Update ${currentSunday} Layout`;

    const inputClass = "w-full p-2.5 border border-white/10 rounded-lg bg-black/20 text-white placeholder-stone-500 text-xs focus:outline-none focus:border-amber-500/40";
    
    fields.innerHTML = `
        <div><label class="text-[10px] text-slate-400 font-bold block mb-1">Weekly Verse Highlight</label><input type="text" id="e-verse" class="${inputClass}" value="${verse}"></div>
        <div><label class="text-[10px] text-slate-400 font-bold block mb-1">Worship Leader</label><input type="text" id="e-wl" class="${inputClass}" value="${wl}"></div>
        <div><label class="text-[10px] text-slate-400 font-bold block mb-1">Backup Singers</label><input type="text" id="e-backup" class="${inputClass}" value="${backup}"></div>
        <div><label class="text-[10px] text-slate-400 font-bold block mb-1">Guitarist</label><input type="text" id="e-guitar" class="${inputClass}" value="${guitar}"></div>
        <div><label class="text-[10px] text-slate-400 font-bold block mb-1">Bass Player</label><input type="text" id="e-bass" class="${inputClass}" value="${bass}"></div>
        <div><label class="text-[10px] text-slate-400 font-bold block mb-1">Drummer</label><input type="text" id="e-drum" class="${inputClass}" value="${drummer}"></div>
        <div><label class="text-[10px] text-slate-400 font-bold block mb-1">Keyboardist</label><input type="text" id="e-key" class="${inputClass}" value="${keyboard}"></div>
        <div><label class="text-[10px] text-slate-400 font-bold block mb-1">Multimedia Operator</label><input type="text" id="e-multi" class="${inputClass}" value="${multimedia}"></div>
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

        handleDbResponse(error, "Ministerial group layout altered directly.", () => {
            closeModal();
            fetchData('schedule');
        });
    };
}

function openEditOfficerModal(id, oldName, oldPos, oldImg) {
    openModal('officer-rep');
    document.getElementById('modal-title').innerText = "Edit Church Officer Settings";
    document.getElementById('f-off-name').value = oldName;
    document.getElementById('f-off-pos').value = oldPos;
    document.getElementById('f-off-img').value = oldImg;
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('church_officers').update({ 
            name: document.getElementById('f-off-name').value, 
            position: document.getElementById('f-off-pos').value, 
            image_url: document.getElementById('f-off-img').value 
        }).eq('id', id);
        handleDbResponse(error, "Profile modifications recorded.", () => {
            closeModal(); 
            fetchData('officers-list');
        });
    };
}

// ==========================================
// REST OF EDIT MODAL OPERATIONS EXTENSIONS
// ==========================================
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
        handleDbResponse(error, "Meeting logging variables modified.", () => {
            closeModal(); 
            fetchData('officers-meetings');
        });
    };
}

function openEditPisoModal(id, oldName, oldAmt, oldDate) {
    openModal('piso');
    document.getElementById('modal-title').innerText = "Edit Piso Balance Line";
    document.getElementById('f-piso-name').value = oldName;
    document.getElementById('f-piso-amt').value = oldAmt;
    document.getElementById('f-piso-date').value = oldDate;
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('piso_a_day').update({ 
            member_name: document.getElementById('f-piso-name').value, 
            amount: parseFloat(document.getElementById('f-piso-amt').value || 0), 
            date_recorded: document.getElementById('f-piso-date').value 
        }).eq('id', id);
        handleDbResponse(error, "Piso collection balance row modified.", () => {
            closeModal(); 
            fetchData('piso-day');
        });
    };
}

function openEditPollModal(id, oldName, oldDesc) {
    openModal('poll');
    document.getElementById('modal-title').innerText = "Edit Event Settings";
    document.getElementById('f-poll-name').value = oldName;
    document.getElementById('f-poll-desc').value = oldDesc;
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('event_polls').update({ 
            event_name: document.getElementById('f-poll-name').value, 
            description: document.getElementById('f-poll-desc').value 
        }).eq('id', id);
        handleDbResponse(error, "Proposition properties calibrated cleanly.", () => {
            closeModal(); 
            fetchData('polls');
        });
    };
}

function openEditFundModal(id, oldType, oldAmt, oldDate, oldRem) {
    openModal('fund');
    document.getElementById('modal-title').innerText = "Edit Fund Row Properties";
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
        handleDbResponse(error, "Financial matrix audit line adjusted.", () => {
            closeModal(); 
            fetchData('funds');
        });
    };
}

// ==========================================
// EXPEDITE WINDOW SCOPE REGISTRATIONS
// ==========================================
window.toggleMobileSidebar = toggleMobileSidebar;
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
