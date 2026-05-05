import { 
    initializeClassPopup,
    initializeHomeworks,
    ShowProfileDropdownDatas,
    loginNeed,
    loginProccess,
    lastFiftyHomeworks,
    profileContent,
    initializeCreateHomeworkModal,
    lastFiftyAttendance,
    lastFiftyScore,
    lastFiftyComments,
    initializeNavbar
} from './module-scripts.js';

document.addEventListener('DOMContentLoaded', async () => {
    initializeNavbar();

    if (await loginNeed()) {
        loginProccess();
    } 
    else {
        const accessToken = localStorage.getItem("accessToken");
        const requestHeaders = new Headers();
        requestHeaders.append("Authorization", "Bearer " + String(accessToken));
    
        const requestOptions = {
            method: "GET",
            headers: requestHeaders,
            redirect: "follow"
        };
    
        async function getGlobalData(){
            const response = await fetch(BACKEND_BASE_URL+"/users/info/", requestOptions);
            const data = await response.json();
            return data;
        }

        const global_data = await getGlobalData();
        ShowProfileDropdownDatas(global_data);
        if (global_data.is_teacher === true) {
            initializeClassPopup();
            initializeCreateHomeworkModal(global_data);
        }
        else {
            initializeHomeworks(global_data);
        }
        profileContent(global_data);
        lastFiftyHomeworks(global_data);
        lastFiftyAttendance(global_data);
        lastFiftyScore(global_data);
        lastFiftyComments(global_data);
    }
    
    const navItems = document.querySelectorAll('.nav-item');
    const bottomNav = document.querySelector('.bottom-nav');

    const indicator = document.createElement('div');
    indicator.className = 'nav-indicator';
    bottomNav.appendChild(indicator);

    const initialPage = window.location.hash.slice(1) || 'home';
    const initialTab = document.querySelector(`[data-page="${initialPage}"]`);
    if (initialTab) {
        initialTab.classList.add('active');
        document.getElementById(initialPage).classList.add('active');
    }
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            navItems.forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

            item.classList.add('active');
            const pageId = item.getAttribute('data-page');
            document.getElementById(pageId).classList.add('active');
        });
    });
});