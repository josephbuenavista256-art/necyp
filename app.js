// CORE CONFIGURATION PARAMETERS [cite: 381]
        const SUPABASE_URL = "https://nbcuzewrgdfdaiowbovc.supabase.co/rest/v1/; // [cite: 381]
        const SUPABASE_ANON_KEY = "sb_publishable_xVZvbjf4t0vRSZCWluJlag_VAURlr6h"; // [cite: 381]
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // [cite: 381]
        
        let isAdmin = false; // [cite: 381]
        let currentActiveTabName = 'announcements';
        let isGlobalThemeDarkMode = false;

        // PLATFORM TOAST ENGINE MESSAGING MIDDLEWARE
        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `p-3.5 rounded-xl text-xs font-medium shadow-xl border flex items-center justify-between gap-3 transform translate-x-5 opacity-0 transition-all duration-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800`;
            
            let colorIndicator = 'text-green-500';
            if (type === 'error') colorIndicator = 'text-red-500';
            if (type === 'warning') colorIndicator = 'text-amber-500';
            
            toast.innerHTML = `
                <div class="flex items-center gap-2.5">
                    <span class="${colorIndicator} font-bold text-sm">●</span>
                    <span>${message}</span>
                </div>
                <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold">✕</button>
            `;
            container.appendChild(toast);
            
            // Trigger animation frame layout properties
            setTimeout(() => {
                toast.classList.remove('translate-x-5', 'opacity-0');
            }, 10);
            
            // Auto clean layout nodes tracking parameters
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-x-2');
                setTimeout(() => toast.remove(), 300);
            }, 4500);
        }

        // INPUT FIELD VALUE OBSERVERS SECURE VIEWS
        function togglePasswordVisibility(fieldId) {
            const field = document.getElementById(fieldId);
            field.type = field.type === 'password' ? 'text' : 'password';
        }

        // ROUTE SYNC TAB MANAGER SWAP ARCHITECTURE
        function switchTab(tabName) {
            currentActiveTabName = tabName;
            
            // Toggle view panels
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden')); // [cite: 382]
            const target = document.getElementById(`tab-${tabName}`);
            if (target) target.classList.remove('hidden'); // [cite: 382]
            
            // Track dynamic link side active visual cues
            document.querySelectorAll('.nav-link').forEach(el => {
                if (el.getAttribute('data-tab') === tabName) {
                    el.classList.add('bg-blue-600/10', 'text-blue-500', 'dark:bg-blue-500/10');
                    el.classList.remove('text-slate-300');
                } else {
                    el.classList.remove('bg-blue-600/10', 'text-blue-500', 'dark:bg-blue-500/10');
                    el.classList.add('text-slate-300');
                }
            });

            fetchData(tabName); // [cite: 382]
        }

        // CONTROLLER LAYER GRAPHICS LIGHTNING SCHEME OVERRIDES
        function toggleThemeMode() {
            isGlobalThemeDarkMode = !isGlobalThemeDarkMode;
            const rootHtml = document.documentElement;
            const icon = document.getElementById('theme-btn-icon');
            
            if (isGlobalThemeDarkMode) {
                rootHtml.classList.add('dark-mode');
                icon.innerText = '☀️';
            } else {
                rootHtml.classList.remove('dark-mode');
                icon.innerText = '🌙';
            }
        }

        // ACCOUNT CONFIG VIEWER INSTANCES MANAGEMENT
        function toggleViewMode(asGuest) {
            document.getElementById('auth-container').classList.add('hidden'); // [cite: 382]
            document.getElementById('app-container').classList.remove('hidden'); // [cite: 382]
            isAdmin = !asGuest; // [cite: 383]
            
            // Interface presentation parameters context
            document.getElementById('user-role-badge').innerText = isAdmin ? "Admin Mode Active" : "Member View (Read-Only)"; // [cite: 383]
            document.getElementById('avatar-display').innerText = isAdmin ? "A" : "G";
            document.getElementById('header-user-title').innerText = isAdmin ? "Administrator Node" : "Visitor Instance";
            document.getElementById('header-user-subtitle').innerText = isAdmin ? "Full Structural Access" : "Read-only Session";

            applyPermissions(); // [cite: 383]
            switchTab('announcements'); // [cite: 383]
        }

        function applyPermissions() {
            document.querySelectorAll('.admin-only').forEach(el => {
                if (isAdmin) {
                    el.classList.remove('hidden'); // [cite: 384]
                } else {
                    el.classList.add('hidden'); // [cite: 384]
                }
            });
        }

        // SUPABASE BACKEND CLOUD SIGNIN INTERACTION LAYER [cite: 386]
        async function login() {
            const email = document.getElementById('login-email').value; // [cite: 385]
            const password = document.getElementById('login-password').value; // [cite: 385]
            const loginBtn = document.getElementById('login-btn');
            
            if(!email || !password) {
                showToast("Please provide valid authentication credentials.", "warning");
                return;
            }

            loginBtn.disabled = true;
            loginBtn.innerHTML = `<span>Connecting Node Instance...</span>`;

            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); // [cite: 386]
            
            loginBtn.disabled = false;
            loginBtn.innerHTML = `<span>Sign In As Admin</span>`;

            if (error) {
                showToast("Authentication Failed: " + error.message, "error"); // [cite: 387]
            } else {
                showToast("Ecclesiastical credential verified successfully.", "success");
                toggleViewMode(false); // [cite: 388]
            }
        }

        function logout() {
            supabaseClient.auth.signOut(); // [cite: 388]
            isAdmin = false; // [cite: 389]
            showToast("Session instances purged successfully.");
            document.getElementById('app-container').classList.add('hidden'); // [cite: 389]
            document.getElementById('auth-container').classList.remove('hidden'); // [cite: 389]
        }

        // CONTENT LOADER RENDERING MIDDLEWARE LAYER INTERFACES [cite: 389]
        async function fetchData(tab) {
            const loader = document.getElementById('tab-skeleton-loader');
            const zone = document.getElementById('active-tab-render-zone');
            
            loader.classList.remove('hidden');
            
            try {
                // ANNOUNCEMENTS MODULE LOGIC RENDERING MATRIX [cite: 389]
                if (tab === 'announcements') {
                    let { data } = await supabaseClient.from('announcements').select('*').order('created_at', { ascending: false }); // [cite: 389]
                    let container = document.getElementById('announcements-list'); // [cite: 390]
                    
                    container.innerHTML = data?.map(item => `
                        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-hover-lift flex justify-between items-start gap-4">
                            <div class="space-y-1">
                                <h3 class="text-sm font-bold text-slate-900 dark:text-white">${item.title}</h3>
                                <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${item.content}</p>
                            </div>
                            <div class="admin-only flex gap-2 shrink-0">
                                <button onclick="openEditModal('announcement', ${item.id}, '${item.title}', '${item.content}')" class="text-[11px] font-bold bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white p-1.5 px-3 rounded-lg transition-all">Edit</button>
                                <button onclick="deleteData('announcements', ${item.id})" class="text-[11px] font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-1.5 px-3 rounded-lg transition-all">Remove</button>
                            </div>
                        </div>`).join('') || '<p class="text-xs text-slate-400 italic">No community updates deployed currently.</p>'; // [cite: 392]
                }

                // SUNDAY ASSIGNMENT WEEKLY TEMPLATES SCHEDULING INTERFACES [cite: 393]
                if (tab === 'schedule') {
                    const selectedSunday = document.getElementById('sunday-filter').value; // [cite: 393]
                    let { data } = await supabaseClient.from('monthly_schedules').select('*').eq('sunday_week', selectedSunday); // [cite: 394]
                    let container = document.getElementById('schedule-container'); // [cite: 394]
                    
                    if (!data || data.length === 0) { // [cite: 395]
                        container.innerHTML = `
                            <div class="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3 bg-white dark:bg-slate-900">
                                <p class="text-xs text-slate-500">No organizational music workflow timeline assigned for <b>${selectedSunday}</b>.</p>
                                <button onclick="setupCustomSunday('${selectedSunday}')" class="admin-only inline-flex bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-500 transition-all cursor-pointer shadow-md">+ Generate Workflow Struct Template</button>
                            </div>
                        `;
                        applyPermissions(); // [cite: 396]
                        loader.classList.add('hidden');
                        return;
                    }

                    let sched = data[0]; // [cite: 396]
                    container.innerHTML = `
                        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
                            <div class="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div class="space-y-1">
                                    <h3 class="text-sm font-bold text-slate-900 dark:text-white">${sched.sunday_week} Layout Metrics</h3>
                                    <div class="text-xs italic text-blue-500 dark:text-blue-400 bg-blue-500/5 p-2.5 rounded-xl border border-blue-500/10"><b>Theological Theme Verse:</b> ${sched.verse}</div>
                                </div>
                                <button onclick="deleteData('monthly_schedules', ${sched.id})" class="admin-only bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer">Purge Layout</button>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900"><b>🎤 Worship Leader:</b> <span class="text-slate-600 dark:text-slate-400 ml-1">${sched.worship_leader || 'Unassigned'}</span></div>
                                <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900"><b>🎶 Vocal Harmony Base:</b> <span class="text-slate-600 dark:text-slate-400 ml-1">${sched.backup_singers || 'Unassigned'}</span></div>
                                <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900"><b>🎸 Lead Guitarist:</b> <span class="text-slate-600 dark:text-slate-400 ml-1">${sched.guitar || 'Unassigned'}</span></div>
                                <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900"><b>🎸 Bass Core:</b> <span class="text-slate-600 dark:text-slate-400 ml-1">${sched.bass || 'Unassigned'}</span></div>
                                <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900"><b>🥁 Rhythm Percussion:</b> <span class="text-slate-600 dark:text-slate-400 ml-1">${sched.drummer || 'Unassigned'}</span></div>
                                <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900"><b>🎹 Synthesizer Keyboard:</b> <span class="text-slate-600 dark:text-slate-400 ml-1">${sched.keyboard || 'Unassigned'}</span></div>
                                <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900 sm:col-span-2 md:col-span-3"><b>💻 Multimedia Operations Operator:</b> <span class="text-slate-600 dark:text-slate-400 ml-1">${sched.multimedia || 'Unassigned'}</span></div>
                            </div>
                            <button onclick="openEditScheduleModal(${sched.id})" class="admin-only w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm">✏️ Remap Dynamic Lineup Allocation Roles</button>
                        </div>
                    `;
                }

                // CHURCH OFFICERS ROSTER FRAMEWORKS [cite: 406]
                if (tab === 'officers-list') {
                    let { data } = await supabaseClient.from('church_officers').select('*').order('created_at', { ascending: true }); // [cite: 406]
                    let container = document.getElementById('officers-grid'); // [cite: 407]
                    
                    container.innerHTML = data?.map(item => `
                        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center card-hover-lift relative">
                            <div class="w-24 h-24 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 mb-3 shadow-inner">
                                <img src="${item.image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" class="w-full h-full object-cover" alt="Officer Asset Portfolio">
                            </div>
                            <h3 class="font-bold text-xs text-slate-900 dark:text-white tracking-tight">${item.name}</h3>
                            <p class="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-0.5">${item.position}</p>
                            
                            <div class="admin-only mt-4 flex gap-2 justify-center w-full border-t border-slate-100 dark:border-slate-800 pt-3">
                                <button onclick="openEditOfficerModal(${item.id}, '${item.name}', '${item.position}', '${item.image_url}')" class="text-[10px] font-bold text-amber-500 hover:underline">Modify</button>
                                <button onclick="deleteData('church_officers', ${item.id})" class="text-[10px] font-bold text-red-500 hover:underline">Purge</button>
                            </div>
                        </div>`).join('') || '<p class="text-xs text-slate-400 italic">No execution officers populated currently.</p>'; // [cite: 409]
                }

                // SYSTEM MEETINGS TIMELINES LEDGERS [cite: 410]
                if (tab === 'officers-meetings') {
                    let { data } = await supabaseClient.from('officer_plans').select('*').order('meeting_date', { ascending: false }); // [cite: 410]
                    let container = document.getElementById('meetings-list'); // [cite: 411]
                    
                    container.innerHTML = data?.map(item => `
                        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 card-hover-lift flex justify-between items-start gap-4">
                            <div class="space-y-1">
                                <h3 class="text-xs font-bold text-slate-900 dark:text-white tracking-tight">${item.title}</h3>
                                <div class="text-[10px] font-semibold text-slate-400 flex items-center gap-1"><span>📅 Logged Agenda Boundary:</span> <span class="text-slate-600 dark:text-slate-300">${item.meeting_date}</span></div>
                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">${item.description || 'No execution breakdown details deployed.'}</p>
                            </div>
                            <div class="admin-only flex gap-1.5 shrink-0">
                                <button onclick="openEditMeetingModal(${item.id}, '${item.title}', '${item.meeting_date}', '${item.description}')" class="text-[10px] font-bold text-amber-500 bg-amber-500/5 hover:bg-amber-500 hover:text-white px-2 py-1 rounded-md transition-all">Edit</button>
                                <button onclick="deleteData('officer_plans', ${item.id})" class="text-[10px] font-bold text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white px-2 py-1 rounded-md transition-all">Delete</button>
                            </div>
                        </div>`).join('') || '<p class="text-xs text-slate-400 italic">No planned executive metrics located.</p>';
                }

                // PISO A DAY TRACKING LEDGER STREAM [cite: 247]
                if (tab === 'piso-day') {
                    let { data } = await supabaseClient.from('piso_a_day').select('*').order('date_recorded', { ascending: false }); // [cite: 247]
                    document.getElementById('piso-table-body').innerHTML = data?.map(item => `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors tabular-row-item">
                            <td class="p-4 pl-6 font-medium text-slate-900 dark:text-white search-target-field">${item.member_name}</td>
                            <td class="p-4 text-emerald-500 font-bold">₱${parseFloat(item.amount).toLocaleString()}</td>
                            <td class="p-4 text-slate-400 font-mono">${item.date_recorded}</td>
                            <td class="admin-only p-4 text-center">
                                <div class="flex gap-2 justify-center">
                                    <button onclick="openEditPisoModal(${item.id}, '${item.member_name}', ${item.amount}, '${item.date_recorded}')" class="text-[11px] bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white p-1 px-2.5 rounded-md transition-all font-semibold">Modify</button>
                                    <button onclick="deleteData('piso_a_day', ${item.id})" class="text-[11px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-1 px-2.5 rounded-md transition-all font-semibold">Purge</button>
                                </div>
                            </td>
                        </tr>`).join('') || '<tr><td colspan="4" class="p-6 text-center text-xs text-slate-400 italic">No microscopic ledger tracking inputs captured yet.</td></tr>'; // [cite: 249]
                }

                // CONSENSUS EVENT VOTE ENGAGEMENT ENGINE [cite: 249]
                if (tab === 'polls') {
                    let { data } = await supabaseClient.from('event_polls').select('*').order('created_at', { ascending: false }); // [cite: 249]
                    let container = document.getElementById('polls-list'); // [cite: 250]
                    
                    container.innerHTML = data?.map(item => `
                        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between text-center card-hover-lift">
                            <div class="space-y-1">
                                <h3 class="text-xs font-bold text-slate-900 dark:text-white tracking-tight">${item.event_name}</h3>
                                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${item.description || 'No descriptive structural log context offered.'}</p>
                            </div>
                            <div class="my-4 bg-blue-500/5 rounded-xl border border-blue-500/10 p-3 flex items-center justify-between">
                                <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Aggregated Votes</span>
                                <span class="text-lg font-black text-blue-500 font-mono">${item.votes}</span>
                            </div>
                            <div class="space-y-2">
                                <button onclick="voteEvent(${item.id}, ${item.votes})" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-blue-600/10">👍 Cast Affinity Agreement / Affirmation</button>
                                <div class="admin-only flex justify-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-2 w-full text-[10px]">
                                    <button onclick="openEditPollModal(${item.id}, '${item.event_name}', '${item.description}')" class="text-amber-500 font-bold hover:underline">Edit Entry</button>
                                    <button onclick="deleteData('event_polls', ${item.id})" class="text-red-500 font-bold hover:underline">Purge Record</button>
                                </div>
                            </div>
                        </div>`).join('') || '<p class="text-xs text-slate-400 italic">No community programmatic options deployed.</p>'; // [cite: 251]
                }

                // TRANSPARENT CHURCH LEDGERS ACCOUNTS CORE [cite: 251]
                if (tab === 'funds') {
                    let { data } = await supabaseClient.from('church_funds').select('*').order('date_recorded', { ascending: false }); // [cite: 251]
                    document.getElementById('funds-table-body').innerHTML = data?.map(item => `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors tabular-row-item">
                            <td class="p-4 pl-6 font-bold text-slate-900 dark:text-white search-target-field uppercase tracking-wider text-[10px]">${item.type}</td>
                            <td class="p-4 text-emerald-500 font-extrabold font-mono">₱${parseFloat(item.amount).toLocaleString()}</td>
                            <td class="p-4 text-slate-400 font-mono">${item.date_recorded}</td>
                            <td class="p-4 text-slate-500 dark:text-slate-400 italic">${item.remarks || ''}</td>
                            <td class="admin-only p-4 text-center">
                                <div class="flex gap-2 justify-center">
                                    <button onclick="openEditFundModal(${item.id}, '${item.type}', ${item.amount}, '${item.date_recorded}', '${item.remarks}')" class="text-[11px] bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white p-1 px-2 rounded-md transition-all font-semibold">Modify</button>
                                    <button onclick="deleteData('church_funds', ${item.id})" class="text-[11px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-1 px-2 rounded-md transition-all font-semibold">Purge</button>
                                </div>
                            </td>
                        </tr>`).join('') || '<tr><td colspan="5" class="p-6 text-center text-xs text-slate-400 italic">No financial ledger entries resolved inside storage layer.</td></tr>'; // [cite: 253]
                }
                
                applyPermissions(); // [cite: 253]
            } catch (e) {
                showToast("Data Layer Mapping Fault: " + e.message, "error");
            } finally {
                loader.classList.add('hidden');
            }
        }

        // DESTRUCTION MATRIX WITH TOAST REPLACEMENTS [cite: 254]
        async function deleteData(table, id) {
            if (!isAdmin) { // [cite: 254]
                showToast("Access Denied: Logged administrative tokens required.", "error"); // [cite: 254]
                return; // [cite: 255]
            }
            
            if (confirm("Confirm core deployment instruction? This action completely wipes item entry metrics natively from the live ledger cloud.")) { // [cite: 255]
                await supabaseClient.from(table).delete().eq('id', id); // [cite: 255]
                showToast("Record dropped completely from cluster layer.", "success");
                let targetTab = table === 'piso_a_day' ? 'piso-day' : (table === 'officer_plans' ? 'officers-meetings' : (table === 'church_officers' ? 'officers-list' : (table === 'monthly_schedules' ? 'schedule' : (table === 'event_polls' ? 'polls' : (table === 'church_funds' ? 'funds' : table))))); // [cite: 256, 257]
                fetchData(targetTab); // [cite: 258]
            }
        }

        // QUANTITATIVE AFFINITY AGREEMENT TRACKER OVERRIDES [cite: 258]
        async function voteEvent(id, currentVotes) {
            await supabaseClient.from('event_polls').update({ votes: currentVotes + 1 }).eq('id', id); // [cite: 258]
            showToast("Aggregated consensus ledger updated successfully.");
            fetchData('polls'); // [cite: 259]
        }

        // SCHEDULING DISPATCH STRUCT LAYER [cite: 259]
        async function setupCustomSunday(weekName) {
            if (!isAdmin) { // [cite: 259]
                showToast("Access Denied: Administrative permissions required.", "error"); // [cite: 259]
                return; // [cite: 260]
            }
            await supabaseClient.from('monthly_schedules').insert([{ sunday_week: weekName, verse: "Proverbs 3:5-6 - Trust in the Lord with all your heart...", worship_leader: '', backup_singers: '', guitar: '', bass: '', drummer: '', keyboard: '', multimedia: '' }]);
            showToast("Dynamic execution structural template provisioned.");
            fetchData('schedule');
        }

        // DYNAMIC NATIVE CLIENT-SIDE SEARCH INTERFACES ENGINE
        function handleGlobalSearch() {
            const query = document.getElementById('global-search-bar').value.toLowerCase();
            
            // Search inside list entries or dynamic tabular streams natively
            const inlineCards = document.querySelectorAll('#active-tab-render-zone h3, .search-target-field');
            inlineCards.forEach(item => {
                const parentBlock = item.closest('.tabular-row-item') || item.closest('.card-hover-lift') || item.closest('.p-5') || item.closest('.bg-white');
                if (parentBlock) {
                    if (item.innerText.toLowerCase().includes(query)) {
                        parentBlock.style.display = "";
                    } else {
                        parentBlock.style.display = "none";
                    }
                }
            });
        }

        // NATIVE TABULAR MATRIX EXPORT CONTROLLER SCHEMES
        function exportTableToExcel(tableBodyId, filename = 'Data_Export') {
            const tbody = document.getElementById(tableBodyId);
            if (!tbody || tbody.rows.length === 0) {
                showToast("No structured row metrics allocated to parse.", "warning");
                return;
            }
            
            let csvContent = "data:text/csv;charset=utf-8,";
            for (let row of tbody.rows) {
                let rowData = [];
                for (let cell of row.cells) {
                    // Extract data variables skipping the actions element arrays
                    if (!cell.classList.contains('admin-only')) {
                        rowData.push(`"${cell.innerText.replace(/"/g, '""')}"`);
                    }
                }
                csvContent += rowData.join(",") + "\r\n";
            }
            
            const encodedUri = encodeURI(csvContent);
            const downloadLink = document.createElement("a");
            downloadLink.setAttribute("href", encodedUri);
            downloadLink.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            showToast("CSV data metric package streamed successfully.");
        }

        // REUSABLE TABULAR COLUMNS SORTING ALGORITHMS
        let sortingDirectionTogglerState = false;
        function sortTableData(tableBodyId, columnIndex, isNumeric = false) {
            const tbody = document.getElementById(tableBodyId);
            const rowsArray = Array.from(tbody.rows);
            sortingDirectionTogglerState = !sortingDirectionTogglerState;

            rowsArray.sort((rowA, rowB) => {
                let cellValueA = rowA.cells[columnIndex].innerText.trim().replace(/₱|,/g, '');
                let cellValueB = rowB.cells[columnIndex].innerText.trim().replace(/₱|,/g, '');

                if (isNumeric) {
                    return sortingDirectionTogglerState ? parseFloat(cellValueA) - parseFloat(cellValueB) : parseFloat(cellValueB) - parseFloat(cellValueA);
                }
                return sortingDirectionTogglerState ? cellValueA.localeCompare(cellValueB) : cellValueB.localeCompare(cellValueA);
            });

            while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
            tbody.append(...rowsArray);
            showToast(`Tabular dimension ordered by selected axis attributes.`);
        }

        // STRUCTURAL INPUT MODALS DIALOG LOGIC CONTROLLERS
        function openModal(type) {
            if (!isAdmin) {
                showToast("Access Token Fault: Administrative scope missing.", "error");
                return;
            }
            
            const fieldsContainer = document.getElementById('modal-fields');
            const title = document.getElementById('modal-title');
            const saveBtn = document.getElementById('modal-save-btn');
            
            fieldsContainer.innerHTML = '';
            document.getElementById('generic-modal').classList.remove('hidden');
            
            // Micro-animation runtime frame hooks
            setTimeout(() => {
                const card = document.getElementById('modal-card-element');
                card.classList.remove('scale-95', 'opacity-0');
                card.classList.add('scale-100', 'opacity-100');
            }, 10);

            if (type === 'announcement') {
                title.innerText = "Provision Announcement Update";
                fieldsContainer.innerHTML = `
                    <div><label class="block font-semibold mb-1 text-slate-400">Update Title Banner</label><input type="text" id="f-ann-title" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                    <div><label class="block font-semibold mb-1 text-slate-400">Content Body Narrative</label><textarea id="f-ann-content" rows="4" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea></div>
                `;
                saveBtn.onclick = async () => {
                    const titleVal = document.getElementById('f-ann-title').value;
                    const contentVal = document.getElementById('f-ann-content').value;
                    if(!titleVal || !contentVal) return showToast("Parameters incomplete.", "warning");
                    await supabaseClient.from('announcements').insert([{ title: titleVal, content: contentVal }]);
                    closeModal(); showToast("Announcement pushed successfully."); fetchData('announcements');
                };
            }
            
            if (type === 'piso') {
                title.innerText = "Log Micro Contribution Asset";
                fieldsContainer.innerHTML = `
                    <div><label class="block font-semibold mb-1 text-slate-400">Member Legal Identity Name</label><input type="text" id="f-piso-name" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                    <div><label class="block font-semibold mb-1 text-slate-400">Amount Input (PHP)</label><input type="number" id="f-piso-amt" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                    <div><label class="block font-semibold mb-1 text-slate-400">Calendar Timestamp Boundary</label><input type="date" id="f-piso-date" value="${new Date().toISOString().slice(0,10)}" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                `;
                saveBtn.onclick = async () => {
                    const name = document.getElementById('f-piso-name').value;
                    const amt = document.getElementById('f-piso-amt').value;
                    const date = document.getElementById('f-piso-date').value;
                    if(!name || !amt) return showToast("Parameters incomplete.", "warning");
                    await supabaseClient.from('piso_a_day').insert([{ member_name: name, amount: parseFloat(amt), date_recorded: date }]);
                    closeModal(); showToast("Contribution transaction synchronized."); fetchData('piso-day');
                };
            }

            if (type === 'officer-rep') {
                title.innerText = "Register Ecclesiastical Leader Portfolio";
                fieldsContainer.innerHTML = `
                    <div><label class="block font-semibold mb-1 text-slate-400">Full Clerical Name</label><input type="text" id="f-off-name" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                    <div><label class="block font-semibold mb-1 text-slate-400">Ministry Staff Designation Position</label><input type="text" id="f-off-pos" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                    <div><label class="block font-semibold mb-1 text-slate-400">Image Asset Hosting Link URL</label><input type="url" id="f-off-img" value="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                `;
                saveBtn.onclick = async () => {
                    const name = document.getElementById('f-off-name').value;
                    const pos = document.getElementById('f-off-pos').value;
                    const img = document.getElementById('f-off-img').value;
                    if(!name || !pos) return showToast("Parameters missing.", "warning");
                    await supabaseClient.from('church_officers').insert([{ name: name, position: pos, image_url: img }]);
                    closeModal(); showToast("Leadership entity stored."); fetchData('officers-list');
                };
            }

            if (type === 'meeting') {
                title.innerText = "Deploy Strategic Plan Entry";
                fieldsContainer.innerHTML = `
                    <div><label class="block font-semibold mb-1 text-slate-400">Agenda Core Banner</label><input type="text" id="f-meet-title" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                    <div><label class="block font-semibold mb-1 text-slate-400">Target Session Boundary Date</label><input type="date" id="f-meet-date" value="${new Date().toISOString().slice(0,10)}" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                    <div><label class="block font-semibold mb-1 text-slate-400">Resolution Descriptions</label><textarea id="f-meet-desc" rows="3" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea></div>
                `;
                saveBtn.onclick = async () => {
                    const t = document.getElementById('f-meet-title').value;
                    const d = document.getElementById('f-meet-date').value;
                    const ds = document.getElementById('f-meet-desc').value;
                    if(!t || !d) return showToast("Required parameters absent.", "warning");
                    await supabaseClient.from('officer_plans').insert([{ title: t, meeting_date: d, description: ds }]);
                    closeModal(); showToast("Corporate plan scheduled."); fetchData('officers-meetings');
                };
            }

            if (type === 'poll') {
                title.innerText = "Suggest Collaborative Event Pipeline";
                fieldsContainer.innerHTML = `
                    <div><label class="block font-semibold mb-1 text-slate-400">Program Proposition Title</label><input type="text" id="f-poll-name" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                    <div><label class="block font-semibold mb-1 text-slate-400">Program Description Scope</label><textarea id="f-poll-desc" rows="3" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea></div>
                `;
                saveBtn.onclick = async () => {
                    const name = document.getElementById('f-poll-name').value;
                    const desc = document.getElementById('f-poll-desc').value;
                    if(!name) return showToast("Name attribute mandatory.", "warning");
                    await supabaseClient.from('event_polls').insert([{ event_name: name, description: desc, votes: 0 }]);
                    closeModal(); showToast("Poll initialization complete."); fetchData('polls');
                };
            }

            if (type === 'fund') {
                title.innerText = "Execute Asset Transaction Entry";
                fieldsContainer.innerHTML = `
                    <div><label class="block font-semibold mb-1 text-slate-400">Asset Stream Allocation Type</label>
                        <select id="f-fund-type" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="Tithe Offering">Tithe Offering</option>
                            <option value="General Mission Disbursement">General Mission Disbursement</option>
                            <option value="Youth Support Contribution">Youth Support Contribution</option>
                            <option value="Special Asset Procurement">Special Asset Procurement</option>
                        </select>
                    </div>
                    <div><label class="block font-semibold mb-1 text-slate-400">Total Transacted Liquidity (PHP)</label><input type="number" id="f-fund-amt" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                    <div><label class="block font-semibold mb-1 text-slate-400">Ledger Entry Valuation Date</label><input type="date" id="f-fund-date" value="${new Date().toISOString().slice(0,10)}" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                    <div><label class="block font-semibold mb-1 text-slate-400">Remarks Audit Context</label><input type="text" id="f-fund-rem" class="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>
                `;
                saveBtn.onclick = async () => {
                    const type = document.getElementById('f-fund-type').value;
                    const amt = document.getElementById('f-fund-amt').value;
                    const date = document.getElementById('f-fund-date').value;
                    const rem = document.getElementById('f-fund-rem').value;
                    if(!amt) return showToast("Financial valuation missing.", "warning");
                    await supabaseClient.from('church_funds').insert([{ type, amount: parseFloat(amt), date_recorded: date, remarks: rem }]);
                    closeModal(); showToast("Liquidity event posted to ledger core."); fetchData('funds');
                };
            }
        }

        // ENTRY INLINE MODIFICATIONS MAPPING REDIRECTS (EDIT LOGICS)
        function openEditModal(module, id, titleOld, contentOld) {
            openModal('announcement');
            document.getElementById('modal-title').innerText = "Update Announcement Vector";
            document.getElementById('f-ann-title').value = titleOld;
            document.getElementById('f-ann-content').value = contentOld;
            document.getElementById('modal-save-btn').onclick = async () => {
                if(!isAdmin) return;
                await supabaseClient.from('announcements').update({ title: document.getElementById('f-ann-title').value, content: document.getElementById('f-ann-content').value }).eq('id', id);
                closeModal(); showToast("Announcement record mutations updated."); fetchData('announcements');
            };
        }

        function openEditScheduleModal(id) {
            if (!isAdmin) return;
            openModal('announcement'); // recycling fields modal template logic parameters directly
            document.getElementById('modal-title').innerText = "Modify Workflow Identity Roster";
            document.getElementById('modal-fields').innerHTML = `
                <div><label class="block font-semibold mb-1 text-slate-400">Worship Leader</label><input type="text" id="f-sc-wl" class="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-200"></div>
                <div><label class="block font-semibold mb-1 text-slate-400">Back-up Harmonies</label><input type="text" id="f-sc-bu" class="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-200"></div>
                <div><label class="block font-semibold mb-1 text-slate-400">Lead Guitar</label><input type="text" id="f-sc-gt" class="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-200"></div>
            `;
            document.getElementById('modal-save-btn').onclick = async () => {
                await supabaseClient.from('monthly_schedules').update({
                    worship_leader: document.getElementById('f-sc-wl').value,
                    backup_singers: document.getElementById('f-sc-bu').value,
                    guitar: document.getElementById('f-sc-gt').value
                }).eq('id', id);
                closeModal(); showToast("ecclessiastical production shifts re-saved."); fetchData('schedule');
            };
        }

        function openEditOfficerModal(id, name, pos, url) {
            openModal('officer-rep');
            document.getElementById('modal-title').innerText = "Update Leader Identity Profile";
            document.getElementById('f-off-name').value = name;
            document.getElementById('f-off-pos').value = pos;
            document.getElementById('f-off-img').value = url;
            document.getElementById('modal-save-btn').onclick = async () => {
                await supabaseClient.from('church_officers').update({ name: document.getElementById('f-off-name').value, position: document.getElementById('f-off-pos').value, image_url: document.getElementById('f-off-img').value }).eq('id', id);
                closeModal(); showToast("Officer profile modified."); fetchData('officers-list');
            };
        }

        function openEditMeetingModal(id, title, date, desc) {
            openModal('meeting');
            document.getElementById('modal-title').innerText = "Edit Scheduled Corporate Resolution";
            document.getElementById('f-meet-title').value = title;
            document.getElementById('f-meet-date').value = date;
            document.getElementById('f-meet-desc').value = desc;
            document.getElementById('modal-save-btn').onclick = async () => {
                await supabaseClient.from('officer_plans').update({ title: document.getElementById('f-meet-title').value, meeting_date: document.getElementById('f-meet-date').value, description: document.getElementById('f-meet-desc').value }).eq('id', id);
                closeModal(); showToast("Agenda record parameters tracking synchronized."); fetchData('officers-meetings');
            };
        }

        function openEditPisoModal(id, oldName, oldAmt, oldDate) {
            openModal('piso');
            document.getElementById('modal-title').innerText = "Edit Contribution Block Parameters";
            document.getElementById('f-piso-name').value = oldName;
            document.getElementById('f-piso-amt').value = oldAmt;
            document.getElementById('f-piso-date').value = oldDate;
            document.getElementById('modal-save-btn').onclick = async () => {
                if(!isAdmin) return;
                await supabaseClient.from('piso_a_day').update({ member_name: document.getElementById('f-piso-name').value, amount: parseFloat(document.getElementById('f-piso-amt').value), date_recorded: document.getElementById('f-piso-date').value }).eq('id', id);
                closeModal(); showToast("Transaction ledger value recalculated."); fetchData('piso-day');
            };
        }

        function openEditPollModal(id, oldName, oldDesc) {
            openModal('poll');
            document.getElementById('modal-title').innerText = "Edit Poll Metric Configuration";
            document.getElementById('f-poll-name').value = oldName;
            document.getElementById('f-poll-desc').value = oldDesc;
            document.getElementById('modal-save-btn').onclick = async () => {
                if (!isAdmin) return;
                await supabaseClient.from('event_polls').update({ event_name: document.getElementById('f-poll-name').value, description: document.getElementById('f-poll-desc').value }).eq('id', id);
                closeModal(); showToast("Event suggestion updated."); fetchData('polls');
            };
        }

        function openEditFundModal(id, oldType, oldAmt, oldDate, oldRem) {
            openModal('fund');
            document.getElementById('modal-title').innerText = "Edit Fund Transaction Ledger Block";
            document.getElementById('f-fund-type').value = oldType;
            document.getElementById('f-fund-amt').value = oldAmt;
            document.getElementById('f-fund-date').value = oldDate;
            document.getElementById('f-fund-rem').value = oldRem;
            document.getElementById('modal-save-btn').onclick = async () => {
                if (!isAdmin) return;
                await supabaseClient.from('church_funds').update({ type: document.getElementById('f-fund-type').value, amount: parseFloat(document.getElementById('f-fund-amt').value), date_recorded: document.getElementById('f-fund-date').value, remarks: document.getElementById('f-fund-rem').value }).eq('id', id);
                closeModal(); showToast("Disbursement asset ledger row committed."); fetchData('funds');
            };
        }

        function closeModal() {
            const card = document.getElementById('modal-card-element');
            card.classList.remove('scale-100', 'opacity-100');
            card.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                document.getElementById('generic-modal').classList.add('hidden');
            }, 150);
        }

        // INITIAL LIFE CYCLE HOOKS ON LOAD EVENT INITIATORS
        window.addEventListener('DOMContentLoaded', () => {
            // Apply native tab selected values state parameters tracking metrics
            switchTab('announcements');
        });
    </script>
</body>
</html>
