// ==========================================
// CONFIGURATION & INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://nbcuzewrgfdaiowbovc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xVZvbjf4t0vRSZCWluJlag_VAURlr6h"; // Siguraduhing tama ang iyong actual anon key dito

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
    fetchData(tabName);
}

function toggleViewMode(asGuest) {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    isAdmin = !asGuest;
    
    document.getElementById('user-role-badge').innerText = isAdmin ? "Admin Mode Active" : "Member View (Read-Only)";
    
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
    
    // Clear inputs
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
            <div class="bg-white p-4 rounded shadow flex justify-between items-center border-l-4 border-blue-600">
                <div>
                    <h3 class="text-xl font-bold text-blue-900">${item.title}</h3>
                    <p class="text-gray-600 mt-1">${item.content}</p>
                </div>
                <div class="admin-only flex gap-4 ml-auto">
                    <button onclick="openEditModal('announcement', ${item.id}, '${item.title}', '${item.content}')" class="text-yellow-600 font-semibold text-sm hover:underline">Edit</button>
                    <button onclick="deleteData('announcements', ${item.id})" class="text-red-600 font-semibold text-sm hover:underline">Remove</button>
                </div>
            </div>`).join('') || '<p class="text-gray-500">No announcements.</p>';
    }

    // 2. SEPARATED SUNDAY SCHEDULES
    if (tab === 'schedule') {
        const selectedSunday = document.getElementById('sunday-filter').value;
        let { data } = await supabaseClient.from('monthly_schedules').select('*').eq('sunday_week', selectedSunday);
        let container = document.getElementById('schedule-container');
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <p class="text-gray-500">No layout assigned for <b>${selectedSunday}</b>.</p>
                <button onclick="setupCustomSunday('${selectedSunday}')" class="admin-only mt-4 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-semibold transition-all cursor-pointer">+ Create a Template for this Week</button>
            `;
            applyPermissions();
            return;
        }

        let sched = data[0];
        container.innerHTML = `
            <div class="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                    <h3 class="text-2xl font-bold text-blue-800">${sched.sunday_week} Layout List</h3>
                    <blockquote class="bg-blue-50 p-3 italic text-gray-700 rounded my-2 border-l-2 border-blue-400"><b>Verse:</b> ${sched.verse || ''}</blockquote>
                </div>
                <button onclick="deleteData('monthly_schedules', ${sched.id})" class="admin-only bg-red-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-red-700 transition-all cursor-pointer">Remove Layout</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800 bg-gray-50 p-4 rounded mb-4">
                <p><b>🎤 Worship Leader:</b> ${sched.worship_leader || 'Unassigned'}</p>
                <p><b>🎶 Back-up Singers:</b> ${sched.backup_singers || 'Unassigned'}</p>
                <p><b>🎸 Guitar:</b> ${sched.guitar || 'Unassigned'}</p>
                <p><b>🎸 Bass:</b> ${sched.bass || 'Unassigned'}</p>
                <p><b>🥁 Drummer:</b> ${sched.drummer || 'Unassigned'}</p>
                <p><b>🎹 Keyboard:</b> ${sched.keyboard || 'Unassigned'}</p>
                <p><b>💻 Multimedia/Lyrics Operator:</b> ${sched.multimedia || 'Unassigned'}</p>
            </div>
            <button onclick="openEditScheduleModal(${sched.id})" class="admin-only mt-2 bg-yellow-500 text-white px-5 py-2.5 rounded text-sm font-bold shadow hover:bg-yellow-600 transition-all cursor-pointer">✏️ Edit Line-up Names</button>
        `;
    }

    // 3. CHURCH OFFICERS
    if (tab === 'officers-list') {
        let { data } = await supabaseClient.from('church_officers').select('*').order('created_at', { ascending: true });
        let container = document.getElementById('officers-grid');
        
        container.innerHTML = data?.map(item => `
            <div class="bg-white p-4 rounded-lg shadow-md flex flex-col items-center text-center relative border border-gray-200">
                <img src="${item.image_url || 'https://via.placeholder.com/200?text=2x2+Photo'}" class="w-32 h-32 object-cover border-2 border-blue-900 rounded mb-3" alt="Officer 2x2">
                <h3 class="font-bold text-lg text-gray-900">${item.name}</h3>
                <p class="text-blue-700 font-semibold text-sm">${item.position}</p>
                <div class="admin-only mt-4 flex gap-4 justify-center w-full border-t border-gray-100 pt-2">
                    <button onclick="openEditOfficerModal(${item.id}, '${item.name}', '${item.position}', '${item.image_url}')" class="text-xs text-yellow-600 font-bold hover:underline">Edit</button>
                    <button onclick="deleteData('church_officers', ${item.id})" class="text-xs text-red-600 font-bold hover:underline">Remove</button>
                </div>
            </div>`).join('') || '<p class="text-gray-500">No officers registered.</p>';
    }

    // 4. OFFICERS MEETINGS & PLANS
    if (tab === 'officers-meetings') {
        let { data } = await supabaseClient.from('officer_plans').select('*').order('meeting_date', { ascending: false });
        let container = document.getElementById('meetings-list');
        
        container.innerHTML = data?.map(item => `
            <div class="glass-panel p-4 rounded-xl shadow border border-white/40 flex justify-between items-center w-full bg-white">
                <div>
                    <h3 class="text-lg font-bold text-blue-900">${item.title}</h3>
                    <p class="text-sm text-gray-500 font-semibold mt-1">📅 Date: ${item.meeting_date}</p>
                    <p class="text-gray-700 mt-2">${item.description || ''}</p>
                </div>
                <div class="admin-only flex gap-4 ml-auto">
                    <button onclick="openEditMeetingModal(${item.id}, '${item.title}', '${item.meeting_date}', '${item.description}')" class="text-yellow-600 font-bold text-sm hover:underline">Edit</button>
                    <button onclick="deleteData('officer_plans', ${item.id})" class="text-red-500 font-bold text-sm hover:underline">Remove</button>
                </div>
            </div>`).join('') || '<p class="text-gray-500">No scheduled meetings.</p>';
    }

    // 5. PISO A DAY
    if (tab === 'piso-day') {
        let { data } = await supabaseClient.from('piso_a_day').select('*').order('date_recorded', { ascending: false });
        document.getElementById('piso-table-body').innerHTML = data?.map(item => `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3 pl-6 text-white">${item.member_name}</td>
                <td class="p-3 text-green-400 font-bold">₱${item.amount}</td>
                <td class="p-3 text-gray-300">${item.date_recorded}</td>
                <td class="admin-only p-3 text-center">
                    <div class="flex gap-4 justify-center">
                        <button onclick="openEditPisoModal(${item.id}, '${item.member_name}', ${item.amount}, '${item.date_recorded}')" class="text-yellow-400 font-semibold text-sm hover:underline">Edit</button>
                        <button onclick="deleteData('piso_a_day', ${item.id})" class="text-red-400 font-semibold text-sm hover:underline">Remove</button>
                    </div>
                </td>
            </tr>`).join('') || '<tr><td colspan="4" class="p-4 text-center text-gray-500">No records found.</td></tr>';
    }

    // 6. EVENT SUGGESTIONS & VOTE POLLS
    if (tab === 'polls') {
        let { data } = await supabaseClient.from('event_polls').select('*').order('created_at', { ascending: false });
        let container = document.getElementById('polls-list');
        
        container.innerHTML = data?.map(item => `
            <div class="bg-white p-5 rounded shadow text-center border border-gray-100 flex flex-col justify-between">
                <div>
                    <h3 class="text-xl font-bold text-blue-900">${item.event_name}</h3>
                    <p class="text-gray-600 text-sm mt-2">${item.description || 'No description'}</p>
                </div>
                <div class="mt-4 bg-blue-50 p-3 rounded-lg">
                    <span class="block text-2xl font-black text-blue-900">${item.votes}</span>
                    <span class="text-xs text-gray-500 font-bold">Total Votes</span>
                </div>
                <div class="mt-4 flex flex-col gap-2">
                    <button onclick="voteEvent(${item.id}, ${item.votes})" class="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 font-bold transition-all cursor-pointer">👍 Vote / Agree</button>
                    <div class="admin-only flex justify-center gap-4 mt-2 border-t border-gray-100 pt-2 w-full">
                        <button onclick="openEditPollModal(${item.id}, '${item.event_name}', '${item.description}')" class="text-xs text-yellow-600 font-bold hover:underline">Edit</button>
                        <button onclick="deleteData('event_polls', ${item.id})" class="text-xs text-red-500 font-bold hover:underline">Remove</button>
                    </div>
                </div>
            </div>`).join('') || '<p class="text-gray-500">No active event suggestions.</p>';
    }

    // 7. CHURCH FUNDS
    if (tab === 'funds') {
        let { data } = await supabaseClient.from('church_funds').select('*').order('date_recorded', { ascending: false });
        document.getElementById('funds-table-body').innerHTML = data?.map(item => `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3 font-semibold pl-6 text-white">${item.type}</td>
                <td class="p-3 text-green-400 font-bold">₱${item.amount}</td>
                <td class="p-3 text-gray-300">${item.date_recorded}</td>
                <td class="p-3 text-gray-200">${item.remarks || ''}</td>
                <td class="admin-only p-3 text-center">
                    <div class="flex gap-4 justify-center">
                        <button onclick="openEditFundModal(${item.id}, '${item.type}', ${item.amount}, '${item.date_recorded}', '${item.remarks}')" class="text-yellow-400 font-semibold text-sm hover:underline">Edit</button>
                        <button onclick="deleteData('church_funds', ${item.id})" class="text-red-400 font-semibold text-sm hover:underline">Remove</button>
                    </div>
                </td>
            </tr>`).join('') || '<tr><td colspan="5" class="p-4 text-center text-gray-500">No financial history logs.</td></tr>';
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

    if (mode === 'announcement') {
        document.getElementById('modal-title').innerText = "Create New Announcement";
        fields.innerHTML = `
            <input type="text" id="f-title" placeholder="Title" class="w-full p-2 border rounded mb-2">
            <textarea id="f-content" placeholder="Details" class="w-full p-2 border rounded"></textarea>`;
        
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
        document.getElementById('modal-title').innerText = "Add Church Officer Representative";
        fields.innerHTML = `
            <input type="text" id="f-off-name" placeholder="Full Name" class="w-full p-2 border rounded mb-2">
            <input type="text" id="f-off-pos" placeholder="Position (e.g., Pastor, Elder, Deacon)" class="w-full p-2 border rounded mb-2">
            <input type="text" id="f-off-img" placeholder="Image URL (Optional)" class="w-full p-2 border rounded">`;
        
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
        document.getElementById('modal-title').innerText = "Add Meeting / Plan Plan";
        fields.innerHTML = `
            <input type="text" id="f-meet-title" placeholder="Plan / Meeting Title" class="w-full p-2 border rounded mb-2">
            <input type="date" id="f-meet-date" class="w-full p-2 border rounded mb-2">
            <textarea id="f-meet-desc" placeholder="Agenda Description Details" class="w-full p-2 border rounded"></textarea>`;
        
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
        document.getElementById('modal-title').innerText = "Add Piso A Day Record";
        fields.innerHTML = `
            <input type="text" id="f-piso-name" placeholder="Member Name" class="w-full p-2 border rounded mb-2">
            <input type="number" id="f-piso-amt" placeholder="Amount (₱)" class="w-full p-2 border rounded mb-2">
            <input type="date" id="f-piso-date" class="w-full p-2 border rounded">`;
        
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
        document.getElementById('modal-title').innerText = "Suggest New Event Poll";
        fields.innerHTML = `
            <input type="text" id="f-poll-name" placeholder="Proposed Event Name" class="w-full p-2 border rounded mb-2">
            <textarea id="f-poll-desc" placeholder="Brief Event Explanation" class="w-full p-2 border rounded"></textarea>`;
        
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
        document.getElementById('modal-title').innerText = "Record Fund Transaction";
        fields.innerHTML = `
            <select id="f-fund-type" class="w-full p-2 border rounded mb-2">
                <option value="Tithes">Tithes</option>
                <option value="Offering">Offering</option>
                <option value="Donation">Special Donation</option>
                <option value="Expense">Expense/Outflow</option>
            </select>
            <input type="number" id="f-fund-amt" placeholder="Amount (₱)" class="w-full p-2 border rounded mb-2">
            <input type="date" id="f-fund-date" class="w-full p-2 border rounded mb-2">
            <input type="text" id="f-fund-rem" placeholder="Remarks/Notes" class="w-full p-2 border rounded">`;
        
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

function openEditScheduleModal(id) {
    // Kinukuha ang kasalukuyang hawak na record para i-edit
    alert("Loading Lineup Editor...");
    // Maaari mo itong palawigin para mag-popup ang 7 input fields ng Praise Team members.
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

// Initial Setup upon page parsing
document.addEventListener('DOMContentLoaded', () => {
    applyPermissions();
});
