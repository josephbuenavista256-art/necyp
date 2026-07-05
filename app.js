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

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
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
            <div class="premium-card border-l-4 border-amber-500/80 flex flex-col sm:flex-row justify-between items-start gap-4 animate-fade-in">
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
                <div class="text-center py-12 premium-card border border-dashed border-white/10 animate-fade-in">
                    <p class="text-slate-400 italic text-sm">No configuration timeline layout assigned for <b class="text-amber-400">${selectedSunday}</b>.</p>
                    <button onclick="setupCustomSunday('${selectedSunday}')" class="admin-only btn-premium-shimmer text-[#090d16] mt-5 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer uppercase tracking-wider">+ Create Template For This Week</button>
                </div>
            `;
            applyPermissions();
            return;
        }

        let sched = data[0];
        container.innerHTML = `
            <div class="flex flex-col lg:flex-row justify-between items-start gap-4 border-b border-white/5 pb-5 mb-6 animate-fade-in">
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

    // 3. CHURCH REPRESENTATIVES (REDESIGNED LUXURY CARDS)
    if (tab === 'officers-list') {
        let { data, error } = await supabaseClient.from('church_officers').select('*').order('created_at', { ascending: true });
        let container = document.getElementById('officers-grid');
        
        if (error) console.error(error);
        container.innerHTML = data?.map(item => `
            <div class="officer-luxury-card p-6 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left group transition-all duration-300">
                <div class="w-24 h-24 overflow-hidden border-4 border-amber-500/20 rounded-2xl shadow-md bg-slate-900 shrink-0 relative">
                    <img src="${item.image_url || 'https://via.placeholder.com/200?text=No+Photo'}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Officer Photo">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div class="flex-1 w-full flex flex-col justify-between">
                    <div>
                        <h3 class="font-extrabold text-xl text-slate-900 tracking-wide line-clamp-1">${item.name}</h3>
                        <p class="font-black text-xs tracking-widest text-amber-700 uppercase mt-1 inline-block bg-amber-600/10 px-3 py-1 rounded-lg">${item.position}</p>
                    </div>
                    <div class="admin-only mt-4 flex gap-2 justify-center sm:justify-start w-full border-t border-slate-200/80 pt-3">
                        <button onclick="openEditOfficerModal(${item.id}, '${item.name}', '${item.position}', '${item.image_url || ''}')" class="btn-edit text-[10px] px-3 py-1.5">Edit Profile</button>
                        <button onclick="deleteData('church_officers', ${item.id})" class="btn-delete text-[10px] px-3 py-1.5">Remove</button>
                    </div>
                </div>
            </div>`).join('') || '<div class="premium-card text-center py-6 text-slate-400 italic sm:col-span-2">No executive profiles deployed inside the cluster.</div>';
    }

    // 4. STRATEGIC COUNCIL MEETINGS
    if (tab === 'officers-meetings') {
        let { data, error } = await supabaseClient.from('officer_plans').select('*').order('meeting_date', { ascending: false });
        let container = document.getElementById('meetings-list');
        
        if (error) console.error(error);
        container.innerHTML = data?.map(item => `
            <div class="premium-card flex flex-col justify-between items-start gap-4 animate-fade-in">
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
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors font-medium animate-fade-in">
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

    // 6. PROPOSALS & ELECTIONS (VOTING BUTTON ACCESSIBLE TO ALL ROLES EXPLICITLY)
    if (tab === 'polls') {
        let { data, error } = await supabaseClient.from('event_polls').select('*').order('created_at', { ascending: false });
        let container = document.getElementById('polls-list');
        
        if (error) console.error(error);
        container.innerHTML = data?.map(item => `
            <div class="premium-card flex flex-col justify-between text-center transition-all animate-fade-in">
                <div>
                    <h3 class="text-xl font-extrabold text-white tracking-wide">${item.event_name}</h3>
                    <p class="text-slate-400 text-xs mt-2 leading-relaxed font-medium line-clamp-3">${item.description || 'No concept description supplied.'}</p>
                </div>
                <div>
                    <div class="my-4 bg-black/30 border border-white/5 p-4 rounded-xl shadow-inner">
                        <span class="block text-4xl font-black text-amber-400 tracking-tighter">${item.votes}</span>
                        <span class="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 block">Verified Assenting Votes</span>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="voteEvent(${item.id}, ${item.votes})" class="w-full bg-[#1e2538] border border-white/10 hover:border-amber-500/30 hover:bg-amber-500 hover:text-[#090d16] text-slate-200 py-2.5 rounded-xl text-xs font-extrabold transition-all uppercase tracking-wider cursor-pointer shadow-sm">
                            👍 Affirm Proposition
                        </button>
                        <div class="admin-only flex justify-center gap-2 mt-2.5 border-t border-white/5 pt-2.5 w-full">
                            <button onclick="openEditPollModal(${item.id}, \`${item.event_name.replace(/"/g, '&quot;')}\`, \`${(item.description || '').replace(/"/g, '&quot;')}\`)" class="btn-edit text-[10px]">Edit</button>
                            <button onclick="deleteData('event_polls', ${item.id})" class="btn-delete text-[10px]">Remove</button>
                        </div>
                    </div>
                </div>
            </div>`).join('') || '<p class="text-slate-400 italic text-sm text-center py-6 sm:col-span-2">No active event layouts proposed.</p>';
    }

    // 7. FINANCIAL ACCOUNTING
    if (tab === 'funds') {
        let { data, error } = await supabaseClient.from('church_funds').select('*').order('date_recorded', { ascending: false });
        if (error) console.error(error);
        
        document.getElementById('funds-table-body').innerHTML = data?.map(item => `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors font-medium animate-fade-in">
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
// SYSTEM OPERATIONAL ACTIONS (VOTE WORKFLOW WITH MEMBER EXCEPTION)
// ==========================================
async function voteEvent(id, currentVotes) {
    // Explicit operational allowance bypass rule for view-only members to cast a vote safely
    const { error } = await supabaseClient
        .from('event_polls')
        .update({ votes: currentVotes + 1 })
        .eq('id', id);

    handleDbResponse(error, "Proposition affirmed! Your active vote vector has been registered.", () => {
        fetchData('polls');
    });
}

// ==========================================
// MODAL FORMS GENERATOR STRUCTLOGIC
// ==========================================
function openModal(type) {
    const titleEl = document.getElementById('modal-title');
    const fieldsEl = document.getElementById('modal-fields');
    const saveBtn = document.getElementById('modal-save-btn');
    
    fieldsEl.innerHTML = '';
    titleEl.innerText = `Deploy New ${type.toUpperCase()} Entry`;

    if (type === 'announcement') {
        fieldsEl.innerHTML = `
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Title</label><input type="text" id="f-ann-title" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Content Body Context</label><textarea id="f-ann-content" rows="4" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></textarea></div>`;
        saveBtn.onclick = async () => {
            const { error } = await supabaseClient.from('announcements').insert([{ title: document.getElementById('f-ann-title').value, content: document.getElementById('f-ann-content').value }]);
            handleDbResponse(error, "Announcement matrix compiled to server cluster.", () => { closeModal(); fetchData('announcements'); });
        };
    }
    
    if (type === 'officer') {
        fieldsEl.innerHTML = `
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Officer Name</label><input type="text" id="f-off-name" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Position Assigned</label><input type="text" id="f-off-pos" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Profile URL</label><input type="text" id="f-off-img" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="https://"></div>`;
        saveBtn.onclick = async () => {
            const { error } = await supabaseClient.from('church_officers').insert([{ name: document.getElementById('f-off-name').value, position: document.getElementById('f-off-pos').value, image_url: document.getElementById('f-off-img').value }]);
            handleDbResponse(error, "Executive profile synced.", () => { closeModal(); fetchData('officers-list'); });
        };
    }

    if (type === 'meeting') {
        fieldsEl.innerHTML = `
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Plan Vector Title</label><input type="text" id="f-meet-title" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Target Date</label><input type="date" id="f-meet-date" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Descriptive Strategy Documentation</label><textarea id="f-meet-desc" rows="3" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></textarea></div>`;
        saveBtn.onclick = async () => {
            const { error } = await supabaseClient.from('officer_plans').insert([{ title: document.getElementById('f-meet-title').value, meeting_date: document.getElementById('f-meet-date').value, description: document.getElementById('f-meet-desc').value }]);
            handleDbResponse(error, "Strategic vector committed securely.", () => { closeModal(); fetchData('officers-meetings'); });
        };
    }

    if (type === 'piso') {
        fieldsEl.innerHTML = `
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Member Identity</label><input type="text" id="f-piso-name" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Offering Value (PHP)</label><input type="number" id="f-piso-amt" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Date Recorded</label><input type="date" id="f-piso-date" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>`;
        saveBtn.onclick = async () => {
            const { error } = await supabaseClient.from('piso_a_day').insert([{ member_name: document.getElementById('f-piso-name').value, amount: parseFloat(document.getElementById('f-piso-amt').value || 0), date_recorded: document.getElementById('f-piso-date').value }]);
            handleDbResponse(error, "Offering lines logged inside youth treasury.", () => { closeModal(); fetchData('piso-day'); });
        };
    }

    if (type === 'poll') {
        fieldsEl.innerHTML = `
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Event Title Name</label><input type="text" id="f-poll-name" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Context Concept Description</label><textarea id="f-poll-desc" rows="3" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></textarea></div>`;
        saveBtn.onclick = async () => {
            const { error } = await supabaseClient.from('event_polls').insert([{ event_name: document.getElementById('f-poll-name').value, description: document.getElementById('f-poll-desc').value, votes: 0 }]);
            handleDbResponse(error, "Proposal election initialized live.", () => { closeModal(); fetchData('polls'); });
        };
    }

    if (type === 'fund') {
        fieldsEl.innerHTML = `
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Fund Category/Type</label><input type="text" id="f-fund-type" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="e.g., Tithes, Youth Fund"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Amount Balance (PHP)</label><input type="number" id="f-fund-amt" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Reconciliation Date</label><input type="date" id="f-fund-date" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase tracking-wider font-black text-slate-400">Remarks / Ledger Notes</label><input type="text" id="f-fund-rem" class="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"></div>`;
        saveBtn.onclick = async () => {
            const { error } = await supabaseClient.from('church_funds').insert([{ type: document.getElementById('f-fund-type').value, amount: parseFloat(document.getElementById('f-fund-amt').value || 0), date_recorded: document.getElementById('f-fund-date').value, remarks: document.getElementById('f-fund-rem').value }]);
            handleDbResponse(error, "Financial ledger statement accounted.", () => { closeModal(); fetchData('funds'); });
        };
    }

    document.getElementById('generic-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('generic-modal').classList.add('hidden');
}

// ==========================================
// MODAL FORMS EDIT WORKFLOWS
// ==========================================
function openEditModal(type, id, title, content) {
    openModal(type);
    document.getElementById('modal-title').innerText = `Update ${type.toUpperCase()} Matrix Entry`;
    document.getElementById('f-ann-title').value = title;
    document.getElementById('f-ann-content').value = content;
    
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('announcements').update({ title: document.getElementById('f-ann-title').value, content: document.getElementById('f-ann-content').value }).eq('id', id);
        handleDbResponse(error, "Announcement matrix adjusted.", () => { closeModal(); fetchData('announcements'); });
    };
}

function openEditScheduleModal(id, sunday, verse, wl, singers, guitar, bass, drummer, keys, multimedia) {
    openModal('schedule');
    document.getElementById('modal-title').innerText = `Update Schedule Matrix Entry`;
    document.getElementById('modal-fields').innerHTML = `
        <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2 space-y-1"><label class="text-[10px] uppercase text-slate-400 font-bold">Scripture Highlight</label><input type="text" id="f-sch-verse" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase text-slate-400 font-bold">Worship Leader</label><input type="text" id="f-sch-wl" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase text-slate-400 font-bold">Vocal Array</label><input type="text" id="f-sch-singers" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase text-slate-400 font-bold">Lead Guitarist</label><input type="text" id="f-sch-guit" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase text-slate-400 font-bold">Bassist Node</label><input type="text" id="f-sch-bass" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase text-slate-400 font-bold">Drums / Rhythm</label><input type="text" id="f-sch-drum" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white"></div>
            <div class="space-y-1"><label class="text-[10px] uppercase text-slate-400 font-bold">Synthesizer</label><input type="text" id="f-sch-keys" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white"></div>
            <div class="col-span-2 space-y-1"><label class="text-[10px] uppercase text-slate-400 font-bold">Projection Operator</label><input type="text" id="f-sch-multi" class="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white"></div>
        </div>`;
        
    document.getElementById('f-sch-verse').value = verse;
    document.getElementById('f-sch-wl').value = wl;
    document.getElementById('f-sch-singers').value = singers;
    document.getElementById('f-sch-guit').value = guitar;
    document.getElementById('f-sch-bass').value = bass;
    document.getElementById('f-sch-drum').value = drummer;
    document.getElementById('f-sch-keys').value = keys;
    document.getElementById('f-sch-multi').value = multimedia;

    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('monthly_schedules').update({
            verse: document.getElementById('f-sch-verse').value,
            worship_leader: document.getElementById('f-sch-wl').value,
            backup_singers: document.getElementById('f-sch-singers').value,
            guitar: document.getElementById('f-sch-guit').value,
            bass: document.getElementById('f-sch-bass').value,
            drummer: document.getElementById('f-sch-drum').value,
            keyboard: document.getElementById('f-sch-keys').value,
            multimedia: document.getElementById('f-sch-multi').value
        }).eq('id', id);
        handleDbResponse(error, "Liturgy timeline roster adjusted configuration successfully.", () => { closeModal(); fetchData('schedule'); });
    };
}

async function setupCustomSunday(sundayName) {
    const { error } = await supabaseClient.from('monthly_schedules').insert([{ sunday_week: sundayName, verse: '', worship_leader: '', backup_singers: '', guitar: '', bass: '', drummer: '', keyboard: '', multimedia: '' }]);
    handleDbResponse(error, "New operational timeline block spawned.", () => { fetchData('schedule'); });
}

function openEditOfficerModal(id, name, position, imageUrl) {
    openModal('officer');
    document.getElementById('modal-title').innerText = `Update Executive Officer Profile`;
    document.getElementById('f-off-name').value = name;
    document.getElementById('f-off-pos').value = position;
    document.getElementById('f-off-img').value = imageUrl;
    
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('church_officers').update({ name: document.getElementById('f-off-name').value, position: document.getElementById('f-off-pos').value, image_url: document.getElementById('f-off-img').value }).eq('id', id);
        handleDbResponse(error, "Executive council matrix rearranged.", () => { closeModal(); fetchData('officers-list'); });
    };
}

function openEditMeetingModal(id, title, date, desc) {
    openModal('meeting');
    document.getElementById('modal-title').innerText = `Update Strategy Plan Node`;
    document.getElementById('f-meet-title').value = title;
    document.getElementById('f-meet-date').value = date;
    document.getElementById('f-meet-desc').value = desc;
    
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('officer_plans').update({ title: document.getElementById('f-meet-title').value, meeting_date: document.getElementById('f-meet-date').value, description: document.getElementById('f-meet-desc').value }).eq('id', id);
        handleDbResponse(error, "Strategic plan matrix element realigned.", () => { closeModal(); fetchData('officers-meetings'); });
    };
}

function openEditPisoModal(id, name, amt, date) {
    openModal('piso');
    document.getElementById('modal-title').innerText = `Update Micro-Offering Transaction Line`;
    document.getElementById('f-piso-name').value = name;
    document.getElementById('f-piso-amt').value = amt;
    document.getElementById('f-piso-date').value = date;
    
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('piso_a_day').update({ member_name: document.getElementById('f-piso-name').value, amount: parseFloat(document.getElementById('f-piso-amt').value || 0), date_recorded: document.getElementById('f-piso-date').value }).eq('id', id);
        handleDbResponse(error, "Offering line metric recalculated inside node ledger.", () => { closeModal(); fetchData('piso-day'); });
    };
}

function openEditPollModal(id, name, desc) {
    openModal('poll');
    document.getElementById('modal-title').innerText = `Update Proposal Event Parameters`;
    document.getElementById('f-poll-name').value = name;
    document.getElementById('f-poll-desc').value = desc;
    
    document.getElementById('modal-save-btn').onclick = async () => {
        const { error } = await supabaseClient.from('event_polls').update({ event_name: document.getElementById('f-poll-name').value, description: document.getElementById('f-poll-desc').value }).eq('id', id);
        handleDbResponse(error, "Event proposition vector strings modified.", () => { closeModal(); fetchData('polls'); });
    };
}

function openEditFundModal(id, type, amt, date, remarks) {
    openModal('fund');
    document.getElementById('modal-title').innerText = `Update Financial Ratios Element`;
    document.getElementById('f-fund-type').value = type;
    document.getElementById('f-fund-amt').value = amt;
    document.getElementById('f-fund-date').value = date;
    document.getElementById('f-fund-rem').value = remarks;
    
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

async function deleteData(table, id) {
    if (!confirm("Are you fully certain you wish to execute a drop command on this node index?")) return;
    const { error } = await supabaseClient.from(table).delete().eq('id', id);
    let mapping = { 'announcements': 'announcements', 'monthly_schedules': 'schedule', 'church_officers': 'officers-list', 'officer_plans': 'officers-meetings', 'piso_a_day': 'piso-day', 'event_polls': 'polls', 'church_funds': 'funds' };
    handleDbResponse(error, "Target deleted from the cloud database cluster.", () => { fetchData(mapping[table]); });
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
