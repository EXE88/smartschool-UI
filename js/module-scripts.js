export function initializeNavbar() {
    const profileButton = document.querySelector('.profile-button');
    const dropdownContent = document.querySelector('.dropdown-content');
    const dropdownItems = document.querySelectorAll('.dropdown-item[data-page]');

    profileButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownContent.classList.toggle('show');
    });

    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            document.querySelector(`.bottom-nav .nav-item[data-page="${pageId}"]`).click();
            dropdownContent.classList.remove('show');
        });
    });

    document.addEventListener('click', (e) => {
        if (!dropdownContent.contains(e.target) && !profileButton.contains(e.target)) {
            dropdownContent.classList.remove('show');
        }
    });
}

export function initializeClassPopup() {
    const accessToken = localStorage.getItem("accessToken");
    const requestHeaders = new Headers();
    requestHeaders.append("Authorization", "Bearer " + String(accessToken));

    const requestOptions = {
        method: "GET",
        headers: requestHeaders,
        redirect: "follow"
    };

    async function getTeacherClasses() {
        const response = await fetch(BACKEND_BASE_URL+"/users/teacher/classes/", requestOptions);
        const data = await response.json();
        return data;
    }

    const list_of_classes = getTeacherClasses();

    list_of_classes.then(classes => {
        classes.forEach(class_details => {
            const class_id = class_details.class_id;
            const lesson_id = class_details.lesson_id;
            const class_name = class_details.class_name;
            const number_of_students = class_details.number_of_students;
            const lesson = class_details.lesson;

            const unique_id = `${class_id}-${lesson_id}`;

            const html = `
            <div class="class-card" data-class-id="${unique_id}">
                <h2>${class_name}</h2>
                <p><i class="bi bi-book"></i>${lesson}</p>
                <p><i class="bi bi-people"></i> ${number_of_students} دانش آموز</p>
            </div>`;

            document.getElementById("class-list-div").insertAdjacentHTML("beforeend", html);
            const class_card = document.querySelector(`[data-class-id="${unique_id}"]`);
            class_card.addEventListener("click", () => {
                showClassDetails(class_id, lesson_id, classes);
            });
        });
    });
}

function showClassDetails(class_id, lesson_id, list_of_classes) {
    const class_details = list_of_classes.find(details => details.class_id === class_id && details.lesson_id === lesson_id);
    const popup = document.getElementById('classPopup');
    const closeButton = popup.querySelector('.close-popup');
    const popup_title = popup.querySelector('#popupTitle');
    const popup_lesson = popup.querySelector('#popupLesson');
    const popup_class = popup.querySelector('#popupClass');
    const popup_student_list = popup.querySelector('.student-list');

    popup_title.textContent = class_details.class_name;
    popup_lesson.textContent = class_details.lesson;
    popup_class.textContent = class_details.class_name;

    popup_student_list.innerHTML = "";

    class_details.students.forEach(student => {
        const additional_data = `
        <div class="student-item" style="direction: rtl;" data-student-id=${student.student_id}>
            <div class="student-info">
                <span class="student-name"><b>نام و نام خانوادگی : </b> ${student.first_name} ${student.last_name}</span>
                <span class="student-id"><b>رشته : </b> ${student.subject}</span>
                <div class="form-check">
                    <p><b>حاضر در کلاس : </b> <input class="form-check-input" type="checkbox" value="" id="attendance-checkbox-student-${student.student_id}"></p>
                </div>
                <div>
                    <input type="number" step="0.01" class="form-control" placeholder="نمره" aria-label="نمره" aria-describedby="basic-addon2" id="score-input-student-${student.student_id}">
                </div>
                <div style="display: flex;gap: 5px;margin-top: 5px;">
                    <button type="button" class="btn btn-primary btn-sm" onclick="sendScore(${student.student_id}, '${String(class_details.lesson)}')">ثبت نمره</button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="sendAttendance(${student.student_id},'${String(class_details.lesson)}')">ثبت حضور/غیاب</button>
                </div>
            </div>
            </div><hr>
        </div>`;

        popup_student_list.insertAdjacentHTML("beforeend", additional_data);

        const scoreInput = document.getElementById(`score-input-student-${student.student_id}`);
        scoreInput.addEventListener('input', (number) => {
            if (number.target.value > 20 || number.target.value < 0) {
                showMessage("مقدار نمره نمیتواند از 20 بالاتر و از 0 کمتر باشد", 1150, 'alert-warning');
                number.target.value = 20;
            }

            scoreInput.setAttribute('inputmode', 'numeric');
        });
    });

    closeButton.addEventListener('click', () => {
        popup.classList.remove('active');
    });

    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.classList.remove('active');
        }
    });

    popup.classList.add("active");
}

export function ShowProfileDropdownDatas(global_data) {
    if (global_data.is_teacher === true) {
        const first_name = global_data.first_name;
        const last_name = global_data.last_name;
        const age = global_data.age;
        const national_code = global_data.national_code;
        const lessons = global_data.lessons;
        const html = `
        <div class="user-info" id="user-info-dropdown">
            <p><strong>نام:</strong> <span id="firstName">${first_name}</span></p>
            <p><strong>نام خانوادگی:</strong> <span id="lastName">${last_name}</span></p>
            <p><strong>سن:</strong> <span id="userAge">${age}</span></p>
            <p><strong>کد ملی:</strong> <span id="nationalCode">${national_code}</span></p>
            <p><strong>دروس:</strong> <span id="teacherLessons">${lessons}</span></p>
        </div>`;
        document.getElementById("dropdown-content-div").insertAdjacentHTML("afterbegin", html);
    } else {
        const first_name = global_data.first_name;
        const last_name = global_data.last_name;
        const age = global_data.age;
        const national_code = global_data.national_code;
        const grade = global_data.grade;
        const subject = global_data.subject;
        const school_class = global_data.school_class;
        const html = `
        <div class="user-info" id="user-info-dropdown">
            <p><strong>نام:</strong> <span id="firstName">${first_name}</span></p>
            <p><strong>نام خانوادگی:</strong> <span id="lastName">${last_name}</span></p>
            <p><strong>سن:</strong> <span id="userAge">${age}</span></p>
            <p><strong>کد ملی:</strong> <span id="nationalCode">${national_code}</span></p>
            <p><strong>پایه:</strong> <span id="userGrade">${grade}</span></p>
            <p><strong>رشته:</strong> <span id="userSubject">${subject}</span></p>
            <p><strong>کلاس:</strong> <span id="userClass">${school_class}</span></p>
        </div>`;
        document.getElementById("dropdown-content-div").insertAdjacentHTML("afterbegin", html);
    }
}

export function initializeHomeworks(global_data) {
    if (global_data.is_teacher === false) {

        const accessToken = localStorage.getItem("accessToken");
        const requestHeaders = new Headers();
        requestHeaders.append("Authorization", "Bearer " + String(accessToken));

        const requestOptions = {
            method: "GET",
            headers: requestHeaders,
            redirect: "follow"
        };

        async function getTomorrosHomeworks() {
            const response = await fetch(BACKEND_BASE_URL+"/homeworks/student/tomorrow/", requestOptions);
            const data = await response.json();
            return data.homeworks;
        }

        const cards_div_html = `
        <div class="container py-5" style="direction: rtl;" >
            <header class="mb-4">
                <h1 class="display-5 mb-3">
                    <i class="bi bi-calendar-week text-primary"></i>
                    تکالیف فردا
                </h1>
            </header>

            <div class="row g-4" id="homework-cards-div"></div>
        </div>`;

        document.getElementById("class-list-div").insertAdjacentHTML("beforeend", cards_div_html);

        const homeworks_array = getTomorrosHomeworks();
        homeworks_array.then(homeworks => {
            if (homeworks.length === 0) {
                const noHomeworkHtml = `
                <div class="empty-state">
                    <div class="icon-wrapper">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
                        </svg>
                    </div>
                    <h3 class="title">هیچ تکالیفی برای فردا ثبت نشده است !!</h3>
                </div>`;
                document.getElementById("homework-cards-div").insertAdjacentHTML("beforeend", noHomeworkHtml);
            }
            homeworks.forEach(homework_details => {
                const card_html = `
                <div class="col-md-6" id="homework-card-${homework_details.homework_id}">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h2 class="h4 mb-0">${homework_details.for_lesson}</h2>
                            </div>
                            <div class="homework-section">
                                <h3 class="h6 text-danger mb-2">
                                    <i class="bi bi-journal-text"></i>
                                    توضیحات
                                </h3>
                                <p class="mb-1">${homework_details.description.replace(/\r\n|\n/g, "<br>")}</p>
                                <h3 class="h6 text-muted mb-2">
                                    از طرف : 
                                    ${homework_details.from_teacher}
                                </h3>
                                <small class="text-muted">مهلت : ${homework_details.expiration_date}</small>
                            </div>
                        </div>
                    </div>
                </div>`;
                document.getElementById("homework-cards-div").insertAdjacentHTML("beforeend", card_html);
            });
        });
    }
}

export function lastFiftyHomeworks(global_data) {
    if (global_data.is_teacher === false) {
        const accessToken = localStorage.getItem("accessToken");
        const requestHeaders = new Headers();
        requestHeaders.append("Authorization", "Bearer " + String(accessToken));

        const requestOptions = {
            method: "GET",
            headers: requestHeaders,
            redirect: "follow"
        };

        async function getLastFiftyHomeworks() {
            const response = await fetch(BACKEND_BASE_URL+"/homeworks/student/recent/", requestOptions);
            const data = await response.json();
            return data.homeworks;
        }


        const homeworks_array = getLastFiftyHomeworks();
        homeworks_array.then(homeworks => {
            if (homeworks.length === 0) {
                const noHomeworkHtml = `
                <div class="empty-state">
                    <div class="icon-wrapper">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
                        </svg>
                    </div>
                    <h3 class="title"> تا کنون هیچ تکلیفی برای شما ثبت نشده است!!</h3>
                </div>`;
                document.getElementById("last-fifty-homework-cards-div").insertAdjacentHTML("beforeend", noHomeworkHtml);
            } else {

                const cards_div_html = `
                <header class="mb-4">
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-calendar-week text-primary"></i>
                        اخرین تکالیف
                    </h1>
                </header>`;

                document.getElementById("last-fifty-homework-header-text").insertAdjacentHTML("afterbegin", cards_div_html);

                const sortedHomeworks = homeworks.sort((a, b) => {
                    if (a.is_expired === b.is_expired) {
                        return 0;
                    }
                    return a.is_expired ? 1 : -1;
                });

                sortedHomeworks.forEach(homework_details => {
                    const tagHtml = homework_details.is_expired ? '<span class="badge bg-danger" id="homework-card-tagHtml-' + String(homework_details.homework_id) + '">منقضی شده</span>' : '<span class="badge bg-success" id="homework-card-tagHtml-' + String(homework_details.homework_id) + '">مهلت دارد</span>';
                    const dangerClass = homework_details.is_expired ? 'alert alert-danger' : '';
                    const textClass = homework_details.is_expired ? 'text-danger' : 'text-muted';
                    const card_html = `
                    <div class="col-md-6" id="homework-card-${homework_details.homework_id}">
                        <div class="card h-100 shadow-sm ${dangerClass}" id="homework-card-shadow-sm-${homework_details.homework_id}">
                            <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h2 class="h4 mb-0">${homework_details.for_lesson}</h2>
                                ${tagHtml}
                            </div>
                            <div class="homework-section">
                                <h3 class="h6 text-danger mb-2">
                                <i class="bi bi-journal-text"></i>
                                توضیحات
                                </h3>
                                <p class="mb-1" id="homework-card-description-${homework_details.homework_id}">${homework_details.description.replace(/\r\n|\n/g, "<br>")}</p>
                                <h3 class="h6 ${textClass} mb-2">
                                    <i class="bi bi-person"></i>
                                    <small class="h6 mb-2">
                                        از طرف : 
                                        ${homework_details.from_teacher}
                                    </small><br>
                                </h3>
                                <h3 class="h6 ${textClass} mb-2">
                                    <i class="bi bi-clock"></i>
                                    <small id="homework-card-expiration-date-${homework_details.homework_id}"> مهلت : ${homework_details.expiration_date}</small>
                                </h3>
                            </div>
                            </div>
                        </div>
                    </div>`;
                    document.getElementById("last-fifty-homework-cards-div").insertAdjacentHTML("beforeend", card_html);
                });
            }
        });
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

        async function getLastFiftyHomeworks() {
            const response = await fetch(BACKEND_BASE_URL+"/homeworks/teacher/recent/", requestOptions);
            const data = await response.json();
            return data.homeworks;
        }

        const header_div_html = `
        <div class="container py-5" id="last-fifty-homework-header-text">
            <div class="d-flex justify-content-center flex-wrap gap-3" id="last-fifty-homework-cards-div"></div>
        </div>`;
        document.getElementById("list-last-fifty-homeworks-div").insertAdjacentHTML("afterbegin", header_div_html);

        const homeworks_array = getLastFiftyHomeworks();
        homeworks_array.then(homeworks => {
            if (homeworks.length === 0) {
                const noHomeworkHtml = `
                <div class="empty-state">
                    <div class="icon-wrapper">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
                        </svg>
                    </div>
                    <h3 class="title"> تا کنون هیچ تکلیفی برای شما ثبت نشده است!!</h3>
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-journal-plus text-primary"></i>
                        <button id="create-homework-btn" class="btn btn-primary" onclick="openCreateHomeworkModal()">ایجاد تکلیف جدید</button>
                    </h1>
                </div>`;
                document.getElementById("last-fifty-homework-cards-div").insertAdjacentHTML("beforeend", noHomeworkHtml);
            } else {
                const headerHtml = `
                <header class="mb-4">
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-calendar-week text-primary"></i>
                        اخرین تکالیف
                    </h1>
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-journal-plus text-primary"></i>
                        <button id="create-homework-btn" class="btn btn-primary" onclick="openCreateHomeworkModal()">ایجاد تکلیف جدید</button>
                    </h1>
                </header>`;
                document.getElementById("last-fifty-homework-header-text").insertAdjacentHTML("afterbegin", headerHtml);

                const sortedHomeworks = homeworks.sort((a, b) => {
                    if (a.is_expired === b.is_expired) {
                        return 0;
                    }
                    return a.is_expired ? 1 : -1;
                });

                sortedHomeworks.forEach(homework_details => {
                    const tagHtml = homework_details.is_expired ? '<span class="badge bg-danger" id="homework-card-tagHtml-' + String(homework_details.homework_id) + '">منقضی شده</span>' : '<span class="badge bg-success" id="homework-card-tagHtml-' + String(homework_details.homework_id) + '">مهلت دارد</span>';
                    const dangerClass = homework_details.is_expired ? 'alert alert-danger' : '';
                    const textClass = homework_details.is_expired ? 'text-danger' : 'text-muted';
                    const cardHtml = `
                    <div class="col-md-6" id="homework-card-${homework_details.homework_id}">
                        <div class="card h-100 shadow-sm ${dangerClass}" id="homework-card-shadow-sm-${homework_details.homework_id}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <button class="btn btn-primary btn-sm mt-2" id="homework-card-submit-button-${homework_details.homework_id}" onclick="openEditHomeworkModal(${homework_details.homework_id},'${homework_details.expiration_date}','${homework_details.description}')">ویرایش</button>
                                    <h2 class="h4 mb-0">${homework_details.for_lesson}</h2>
                                    ${tagHtml}
                                </div>
                                <div class="homework-section">
                                    <h3 class="h6 ${textClass} mb-2" id="homework-card-for-class-${homework_details.homework_id}-h3">
                                        <i class="bi bi-people"></i>
                                        کلاس: ${homework_details.for_class}
                                    </h3>
                                    <h3 class="h6 text-danger mb-2">
                                        <i class="bi bi-journal-text"></i>
                                        توضیحات
                                    </h3>
                                    <p class="mb-1" id="homework-card-description-${homework_details.homework_id}">${homework_details.description.replace(/\r\n|\n/g, "<br>")}</p>
                                    <h3 class="h6 ${textClass} mb-2" id="homework-card-expiration-date-${homework_details.homework_id}-h3">
                                        <i class="bi bi-clock"></i>
                                        <small id="homework-card-expiration-date-${homework_details.homework_id}"> مهلت : ${homework_details.expiration_date}</small>
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    document.getElementById("last-fifty-homework-cards-div").insertAdjacentHTML("beforeend", cardHtml);
                });
                sortedHomeworks.forEach(homework_details => {
                    document.getElementById("homework-card-submit-button-" + String(homework_details.homework_id)).onclick = function () {
                        openEditHomeworkModal(homework_details.homework_id, document.getElementById("homework-card-expiration-date-" + String(homework_details.homework_id)).innerText.replace("مهلت : ", ""), homework_details.description);
                    };
                });
            }
        });
    }
}

export async function loginNeed() {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken && accessToken) {
        const requestHeaders = new Headers();
        requestHeaders.append("Authorization", "Bearer " + String(accessToken));

        const requestOptions = {
            method: "POST",
            headers: requestHeaders,
            redirect: "follow"
        };

        try {
            const response = await fetch(BACKEND_BASE_URL+'/users/verifytokens/', requestOptions);
            if (response.status === 200) {
                return false;
            } else if (response.status === 401) {
                const formdata = new FormData();
                formdata.append("refresh", refreshToken);

                const refreshRequestOptions = {
                    method: "POST",
                    body: formdata,
                    redirect: "follow"
                };

                const refreshResponse = await fetch(BACKEND_BASE_URL+"/api/token/refresh/", refreshRequestOptions);
                if (refreshResponse.status === 200) {
                    const response_json = await refreshResponse.json();
                    localStorage.setItem("accessToken", response_json.access);
                    localStorage.setItem("refreshToken", response_json.refresh);
                    return false;
                } else if (refreshResponse.status === 401) {
                    console.log(await refreshResponse.json());
                    return true;
                } else {
                    console.log("error");
                    return true;
                }
            } else {
                console.log(response.status);
                console.log("error...");
                return true;
            }
        } catch (error) {
            console.log(error);
            return true;
        }
    } else {
        return true;
    }
}

export function loginProccess() {
    const dashboard = document.getElementById("dashboard");
    const loginPage = document.getElementById("loginPage");
    const loginButton = document.getElementById("login-form-submit-button");

    dashboard.classList.add("hidden");
    loginPage.classList.remove("hidden");

    loginButton.addEventListener('click', () => {
        sendData();
    });

    async function sendData() {
        const username = document.getElementById("typeUsernameX").value;
        const password = document.getElementById("typePasswordX").value;

        const formdata = new FormData();
        formdata.append("username", String(username));
        formdata.append("password", String(password));

        const requestOptions = {
            method: "POST",
            body: formdata,
            redirect: "follow"
        };

        if (username && password) {
            try {
                const response = await fetch(BACKEND_BASE_URL+'/api/token/', requestOptions);
                if (response.status === 200) {

                    const response_json = await response.json();
                    console.log(response_json);

                    localStorage.setItem("accessToken", response_json.access);
                    localStorage.setItem("refreshToken", response_json.refresh);
                    showMessage("با موفقیت وارد شدید", 1300, "alert-success");

                    const accessToken = localStorage.getItem("accessToken");
                    const requestHeaders = new Headers();
                    requestHeaders.append("Authorization", "Bearer " + String(accessToken));

                    const requestOptions = {
                        method: "GET",
                        headers: requestHeaders,
                        redirect: "follow"
                    };

                    fetch(BACKEND_BASE_URL+"/users/info/", requestOptions)
                        .then(response => response.json())
                        .then(data => {
                            const global_data = data;
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
                        })

                    const loginPage = document.getElementById("loginPage");
                    const dashboard = document.getElementById("dashboard");

                    loginPage.classList.add("hidden");
                    dashboard.classList.remove("hidden");
                }
                else {
                    showMessage("حساب کاربری با این مشخصات یافت نشد", 1300, "alert-danger");
                }
            }
            catch (error) {
                console.error(error);
            }
        }
        else {
            showMessage("لطفا مقادیر را کامل وارد کنید", 1300, "alert-warning");
        }
    }
}

export function profileContent(global_data) {

    const accessToken = localStorage.getItem("accessToken");
    const requestHeaders = new Headers();
    requestHeaders.append("Authorization", "Bearer " + String(accessToken));

    const requestOptions = {
        method: "GET",
        headers: requestHeaders,
        redirect: "follow"
    };

    async function getUserPersonalData() {
        const response = await fetch(BACKEND_BASE_URL+"/users/info/", requestOptions);
        const data = await response.json();
        return data;
    }

    const personal_data = getUserPersonalData();
    personal_data.then(info => {
        if (global_data.is_teacher === true) {
            const html_teacher = `
            <div class="container teacher-profile">
                <header class="profile-header">
                    <div class="profile-image">
                        <img src="images/avatar.png" alt="Profile Picture">
                    </div>
                    <h1>${info.first_name} ${info.last_name}</h1>
                </header>

                <section class="personal-info">
                    <h2>مشخصات فردی</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">نام :</span>
                            <span class="info-value">${info.first_name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">نام خانوادگی :</span>
                            <span class="info-value">${info.last_name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">سن :</span>
                            <span class="info-value">${info.age}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">کد ملی :</span>
                            <span class="info-value">${info.national_code}</span>
                        </div>
                    </div>
                </section>

                <section class="teaching-info">
                    <h2>مشخصات تحصیلی</h2>
                    <div class="classes-grid">
                        <div class="class-item">
                            <h3>درس های در حال تدریس</h3>
                            <div class="class-details">
                                ${info.lessons.map(lessonItem => `<span class="detail">${lessonItem}</span>`).join('')}
                            </div>
                        </div>
                        <div class="class-item">
                            <h3>کلاس های من</h3>
                            <div class="class-details">
                                ${info.classes.map(classItem => `<span class="detail">${classItem}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </section>
            </div>`;

            document.getElementById("educational-profile-system-div").insertAdjacentHTML("afterbegin", html_teacher);
        } else {
            const html_student = `
            <div class="container student-profile">
                <header class="profile-header">
                    <div class="profile-image">
                        <img src="images/avatar.png" alt="Profile Picture">
                    </div>
                    <h1>${info.first_name} ${info.last_name}</h1>
                </header>

                <section class="personal-info">
                    <h2>مشخصات فردی</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">نام :</span>
                            <span class="info-value">${info.first_name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">نام خانوادگی :</span>
                            <span class="info-value">${info.last_name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">سن :</span>
                            <span class="info-value">${info.age}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">کد ملی :</span>
                            <span class="info-value">${info.national_code}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">ادرس خانه :</span>
                            <span class="info-value">${info.home_address}</span>
                        </div>                        
                        <div class="info-item">
                            <span class="info-label">شماره تلفن پدر :</span>
                            <span class="info-value">${info.father_phone_number}</span>
                        </div>   
                        <div class="info-item">
                            <span class="info-label">شماره تلفن مادر :</span>
                            <span class="info-value">${info.mother_phone_number}</span>
                        </div>                                               
                        <div class="info-item">
                            <span class="info-label">شماره تلفن ثابت :</span>
                            <span class="info-value">${info.home_phone_number}</span>
                        </div> 
                    </div>
                </section>

                <section class="academic-info">
                    <h2>مشخصات تحصیلی</h2>
                    <div class="courses-grid">
                        <div class="course-item">
                            <span class="course-name">رشته</span>
                            <span class="course-code">${info.subject}</span>
                        </div>
                        <div class="course-item">
                            <span class="course-name">پایه</span>
                            <span class="course-code">${info.grade}</span>
                        </div>
                        <div class="course-item">
                            <span class="course-name">کلاس </span>
                            <div class="class-details">
                                ${info.school_class.map(classItem => `<span class="detail">${classItem}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </section>
            </div>`;
            document.getElementById("educational-profile-system-div").insertAdjacentHTML("afterbegin", html_student);
        }
    })

}

export function initializeCreateHomeworkModal(global_data) {
    const form = document.getElementById("create-homework-modal-form")
    const lessonOptions = `<option value="" disabled selected>انتخاب درس</option>` + global_data.lessons.map(lesson => `<option value="${lesson}">${lesson}</option>`).join('');
    const classOptions = `<option value="" disabled selected>انتخاب کلاس</option>` + global_data.classes.map(classItem => `<option value="${classItem}">${classItem}</option>`).join('');

    const html = `
    <div data-mdb-input-init class="form-outline mb-4">
        <label class="form-label" for="lesson-select">درس :</label>
        <select id="create-homework-lesson-select" class="form-control">
            ${lessonOptions}
        </select>
    </div>

    <div data-mdb-input-init class="form-outline mb-4">
        <label class="form-label" for="class-select">کلاس :</label>
        <select id="create-homework-class-select" class="form-control">
            ${classOptions}
        </select>
    </div>
    `;

    form.insertAdjacentHTML("afterbegin", html);
}

export function lastFiftyAttendance(global_data){
    
    const accessToken = localStorage.getItem("accessToken");
    const requestHeaders = new Headers();
    requestHeaders.append("Authorization", "Bearer " + String(accessToken));

    const requestOptions = {
        method: "GET",
        headers: requestHeaders,
        redirect: "follow"
    };

    async function getLastFiftyAttendance () {
        const response = await fetch(BACKEND_BASE_URL+"/attendance/recent/", requestOptions);
        const data = await response.json();
        return data.data;
    }

    const response = getLastFiftyAttendance();

    if (global_data.is_teacher===true){
        response.then(response_obj=>{
            if (response_obj.length === 0) {
                const noHomeworkHtml = `
                <div class="empty-state">
                    <div class="icon-wrapper">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
                        </svg>
                    </div>
                    <h3 class="title"> تا کنون هیچ حضور/غیابی برای شما ثبت نشده است!!</h3>
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-person-check text-primary"></i>
                        <button id="create-attendance-btn" class="btn btn-primary" onclick="openCreateAttendanceModal()">ایجاد حضور/غیاب جدید</button>
                    </h1>
                </div>`;
                document.getElementById("last-fifty-attendance-cards-div").insertAdjacentHTML("beforeend", noHomeworkHtml);
            } 
            else {
                const headerHtml = `
                <header class="mb-4">
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-calendar-week text-primary"></i>
                        اخرین حضور/غیاب های ثبت شده
                    </h1>
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-person-check text-primary"></i>
                        <button id="create-attendance-btn" class="btn btn-primary" onclick="openCreateAttendanceModal()">ایجاد حضور/غیاب جدید</button>
                    </h1>
                    <input type="text" id="attendance-search-bar" class="form-control" placeholder="جستجو بر اساس نام دانش‌آموز" onkeyup="searchAttendanceCards()"><br>
                </header>`;
                document.getElementById("last-fifty-attendance-header-text").insertAdjacentHTML("afterbegin", headerHtml);
            }

            response_obj.forEach(attendance_details => {
                const dangerClass = attendance_details.is_present ? 'alert alert-success' : 'alert alert-danger';
                const textClass = attendance_details.is_present ? 'text-success' : 'text-danger';
                const present_status = attendance_details.is_present ? 'حاضر' : 'غایب';
                const checkIcon = attendance_details.is_present ? 'check' : 'x';
                const cardHtml = `
                <div class="col-md-6" id="attendance-card-${attendance_details.attendance_id}">
                    <div class="card h-100 shadow-sm ${dangerClass}" id="attendance-card-shadow-sm-${attendance_details.attendance_id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <button class="btn btn-primary btn-sm mt-2" id="attendance-card-submit-button-${attendance_details.attendance_id}" onclick="openEditAttendanceModal(${attendance_details.attendance_id},${attendance_details.is_present})">ویرایش</button>
                                <h2 class="h4 mb-0" id="attendance-student-name">${attendance_details.to_student}</h2>
                            </div>
                            <div class="homework-section">
                                <h3 class="h6 ${textClass} mb-2" id="attendance-card-${attendance_details.attendance_id}-homework-section-status">
                                    <i class="bi bi-person-${checkIcon}" id="attendance-card-${attendance_details.attendance_id}-homework-section-icon-present-status"></i>
                                    وضعیت : ${present_status}
                                </h3>
                                <h3 class="h6 ${textClass} mb-2" id="attendance-card-${attendance_details.attendance_id}-homework-section-lesson">
                                    <i class="bi bi-journal-${checkIcon}" id="attendance-card-${attendance_details.attendance_id}-homework-section-icon-lesson"></i>
                                    درس : ${attendance_details.in_lesson}
                                </h3>
                                <h3 class="h6 ${textClass} mb-2" id="attendance-card-${attendance_details.attendance_id}-homework-section-h3-lesson">
                                    <i class="bi bi-clock"></i>
                                    <small class=${textClass}  id="attendance-card-${attendance_details.attendance_id}-homework-section-expiration-date">تاریخ ثبت : ${attendance_details.created_at}</small>
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>`;
                document.getElementById("last-fifty-attendance-cards-div").insertAdjacentHTML("beforeend", cardHtml);
            });
        });

        async function getTeacherClassesAndStudents() {
            const response2 = await fetch(BACKEND_BASE_URL+"/users/teacher/classes/", requestOptions);
            const data2 = await response2.json();
            return data2;
        }
        
        let students = [];
        let studentIds = new Set();
        let lessons = [];
        let lessonIds = new Set();
        
        getTeacherClassesAndStudents().then(response_obj => {
            response_obj.forEach(class_details => {

                if (!lessonIds.has(class_details.lesson_id)) {
                    lessonIds.add(class_details.lesson_id);
                    lessons.push({
                        lesson_id: class_details.lesson_id,
                        lesson_name: class_details.lesson
                    });
                }
        
                class_details.students.forEach(student => {
                    if (!studentIds.has(student.student_id)) {
                        studentIds.add(student.student_id);
                        students.push(student);
                    }
                });
            });
        
            const studentOptions = `
                <option value="" disabled selected>انتخاب دانش‌آموز</option>
                ${students.map(student => 
                    `<option value="${student.student_id}">${student.first_name} ${student.last_name}</option>`
                ).join('')}
            `;
        
            const lessonOptions = `
                <option value="" disabled selected>انتخاب درس</option>
                ${lessons.map(lesson => 
                    `<option value="${lesson.lesson_name}">${lesson.lesson_name}</option>`
                ).join('')}
            `;
        
            const formHtml = `
                <div data-mdb-input-init class="form-outline mb-4">
                    <label class="form-label" for="create-attendance-student-select">انتخاب دانش‌آموز:</label>
                    <select id="create-attendance-student-select" class="form-control">
                        ${studentOptions}
                    </select>
                </div>
                <div data-mdb-input-init class="form-outline mb-4">
                    <label class="form-label" for="create-attendance-lesson-select">انتخاب درس:</label>
                    <select id="create-attendance-lesson-select" class="form-control">
                        ${lessonOptions}
                    </select>
                </div>
            `;
        
            document.getElementById("create-attendance-form").insertAdjacentHTML("afterbegin", formHtml);
        });
        
        

    }
    else{
        response.then(response_obj=>{
            if (response_obj.length === 0) {
                const noHomeworkHtml = `
                <div class="empty-state">
                    <div class="icon-wrapper">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-calendar-check" viewBox="0 0 16 16">
                          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                          <path d="M10.854 9.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 11.293l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                    </div>
                    <h3 class="title"> تا کنون هیچ حضور/غیابی برای شما ثبت نشده است!!</h3>
                </div>`;
                document.getElementById("last-fifty-attendance-cards-div").insertAdjacentHTML("beforeend", noHomeworkHtml);
            } 
            else {
                const headerHtml = `
                <header class="mb-4">
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-person-check text-primary"></i>
                        اخرین حضور/غیاب های ثبت شده
                    </h1>
                </header>`;
                document.getElementById("last-fifty-attendance-header-text").insertAdjacentHTML("afterbegin", headerHtml);

                response_obj.forEach(attendance_details => {
                    const dangerClass = attendance_details.is_present ? 'alert alert-success' : 'alert alert-danger';
                    const textClass = attendance_details.is_present ? 'text-success' : 'text-danger';
                    const present_status = attendance_details.is_present ? 'حاضر' : 'غایب';
                    const checkIcon = attendance_details.is_present ? 'check' : 'x';
                    const cardHtml = `
                    <div class="col-md-6" id="attendance-card-${attendance_details.attendance_id}">
                        <div class="card h-100 shadow-sm ${dangerClass}" id="attendance-card-shadow-sm-${attendance_details.attendance_id}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h2 class="h4 mb-0">${attendance_details.in_lesson}</h2>
                                </div>
                                <div class="homework-section">
                                    <h3 class="h6 ${textClass} mb-2">
                                        <i class="bi bi-person-${checkIcon}"></i>
                                        وضعیت : ${present_status}
                                    </h3>
                                    <h3 class="h6 ${textClass} mb-2">
                                        <i class="bi bi-person-video3"></i>
                                        معلم : ${attendance_details.from_teacher}
                                    </h3>
                                    <h3 class="h6 ${textClass} mb-2">
                                        <i class="bi bi-clock"></i>
                                        <small class=${textClass}  id="homework-card-expiration-date-${attendance_details.attendance_id}">تاریخ ثبت : ${attendance_details.created_at}</small>
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    document.getElementById("last-fifty-attendance-cards-div").insertAdjacentHTML("beforeend", cardHtml);
                });
            }
        })    
    }   
}

export function lastFiftyScore(global_data){

    const accessToken = localStorage.getItem("accessToken");
    const requestHeaders = new Headers();
    requestHeaders.append("Authorization", "Bearer " + String(accessToken));

    const requestOptions = {
        method: "GET",
        headers: requestHeaders,
        redirect: "follow"
    };

    async function getLastFiftyScore() {
        const response = await fetch(BACKEND_BASE_URL+"/scores/recent/", requestOptions);
        const data = await response.json();
        return data.data;
    }

    const response = getLastFiftyScore();
    
    if (global_data.is_teacher===true){

        async function getTeacherStudents() {
            const response2 = await fetch(BACKEND_BASE_URL+"/users/teacher/classes/", requestOptions);
            const data2 = await response2.json();
            return data2;
        }
        
        let students = [];
        let studentIds = new Set();
        let lessons = [];
        let lessonIds = new Set();
        
        getTeacherStudents().then(response_obj => {
            response_obj.forEach(class_details => {
    
                if (!lessonIds.has(class_details.lesson_id)) {
                    lessonIds.add(class_details.lesson_id);
                    lessons.push({
                        lesson_id: class_details.lesson_id,
                        lesson_name: class_details.lesson
                    });
                }
        
                class_details.students.forEach(student => {
                    if (!studentIds.has(student.student_id)) {
                        studentIds.add(student.student_id);
                        students.push(student);
                    }
                });
            });
    
            const studentOptions = `
                <option value="" disabled selected>انتخاب دانش‌آموز</option>
                ${students.map(student => `<option value="${student.student_id}">${student.first_name} ${student.last_name}</option>`).join('')}
            `;
    
            const lessonOptions = `
                <option value="" disabled selected>انتخاب درس</option>
                ${lessons.map(lesson => `<option value="${lesson.lesson_name}">${lesson.lesson_name}</option>`).join('')}
            `;
    
            const formHtml = `
                <div data-mdb-input-init class="form-outline mb-4">
                    <label class="form-label" for="create-score-student-select">انتخاب دانش‌آموز:</label>
                    <select id="create-score-student-select" class="form-control">
                        ${studentOptions}
                    </select>
                </div>
                <div data-mdb-input-init class="form-outline mb-4">
                    <label class="form-label" for="create-score-lesson-select">انتخاب درس:</label>
                    <select id="create-score-lesson-select" class="form-control">
                        ${lessonOptions}
                    </select>
                </div>
            `;
    
            document.getElementById("create-score-form").insertAdjacentHTML("afterbegin", formHtml);
        })

        response.then(response_obj=>{
            if(response_obj.length===0){
                const noScorekHtml = `
                <div class="empty-state text-center">
                    <div class="icon-wrapper">
                        <i class="bi bi-award text-muted display-3"></i>
                    </div>
                    <h3 class="title mt-3">تا کنون هیچ نمره‌ای توسط شما ثبت نشده است!!</h3>
                    <h1 class="display-5 mb-3 text-center">
                        <button id="create-score-btn" class="btn btn-primary mt-2" onclick="openCreateScoreModal()">ثبت نمره جدید</button>
                    </h1>
                </div>`;
                document.getElementById("last-fifty-score-cards-div").insertAdjacentHTML("beforeend", noScorekHtml);
            }
            else {
                const headerHtml = `
                <header class="mb-4">
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-award text-primary"></i>
                        اخرین نمره های ثبت شده
                    </h1>
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-award-fill text-warning"></i>
                        <button id="create-score-btn" class="btn btn-primary" onclick="openCreateScoreModal()">ثبت نمره جدید</button>
                    </h1>
                    <input type="text" id="score-search-bar" class="form-control" placeholder="جستجو بر اساس نام دانش‌آموز" onkeyup="searchScoreCards()"><br>
                </header>`;
                document.getElementById("last-fifty-score-header-text").insertAdjacentHTML("afterbegin", headerHtml);

                response_obj.forEach(score_details=>{
                    const cardHtml = `
                    <div class="col-md-6" id="score-card-${score_details.score_id}">
                        <div class="card h-100 shadow-sm" id="score-card-shadow-sm-${score_details.score_id}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <button class="btn btn-primary btn-sm mt-2" id="score-card-submit-button-${score_details.score_id}" onclick="openEditScoreModal(${score_details.score}, ${score_details.score_id})">ویرایش</button>
                                    <h2 class="h4 mb-0" id="score-student-name">${score_details.to_student}</h2>
                                </div>
                                <div class="homework-section">
                                    <h3 class="h6 mb-2" id="score-card-${score_details.score_id}-homework-section-score-count">
                                        <i class="bi bi-person text-primary" id="score-card-${score_details.score_id}-homework-section-icon-score-count"></i>
                                        نمره : ${score_details.score}
                                    </h3>
                                    <h3 class="h6 mb-2" id="score-card-${score_details.score_id}-homework-section-lesson">
                                        <i class="bi bi-journal text-primary" id="score-card-${score_details.score_id}-homework-section-icon-lesson"></i>
                                        درس : ${score_details.in_lesson}
                                    </h3>
                                    <h3 class="h6 mb-2" id="score-card-${score_details.score_id}-homework-section-createdat">
                                        <i class="bi bi-clock text-primary"></i>
                                        <small id="score-card-${score_details.score_id}-homework-section-expiration-date">تاریخ ثبت : ${score_details.created_at}</small>
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    document.getElementById("last-fifty-score-cards-div").insertAdjacentHTML("beforeend", cardHtml);
                })
            }
        })
    }else{
        response.then(response_obj=>{
            if(response_obj.length===0){
                const noScorekHtml = `
                <div class="empty-state text-center">
                    <div class="icon-wrapper">
                        <i class="bi bi-award text-muted display-3"></i>
                    </div>
                    <h3 class="title mt-3">تا کنون هیچ نمره‌ای برای شما ثبت نشده است!!</h3>
                </div>`;
                document.getElementById("last-fifty-score-cards-div").insertAdjacentHTML("beforeend", noScorekHtml);
            }
            else {
                const headerHtml = `
                <header class="mb-4">
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-award text-primary"></i>
                        اخرین نمره های ثبت شده
                    </h1>
                    <input type="text" id="score-search-bar-for-lesson" class="form-control" placeholder="جستجو بر اساس نام درس" onkeyup="searchScoreCardsForStudet()"><br>
                </header>`;
                document.getElementById("last-fifty-score-header-text").insertAdjacentHTML("afterbegin", headerHtml);

                response_obj.forEach(score_details=>{
                    const cardHtml = `
                    <div class="col-md-6" id="score-card-${score_details.score_id}">
                        <div class="card h-100 shadow-sm" id="score-card-shadow-sm-${score_details.score_id}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h2 class="h4 mb-0" id="score-student-name">${score_details.in_lesson}</h2>
                                </div>
                                <div class="homework-section">
                                    <h3 class="h6 mb-2" id="score-card-${score_details.score_id}-homework-section-score-count">
                                        <i class="bi bi-person text-primary" id="score-card-${score_details.score_id}-homework-section-icon-score-count"></i>
                                        نمره : ${score_details.score}
                                    </h3>
                                    <h3 class="h6 mb-2" id="score-card-${score_details.score_id}-homework-section-from-teacher">
                                        <i class="bi bi-journal text-primary" id="score-card-${score_details.score_id}-homework-section-icon-from-teacher"></i>
                                        معلم : ${score_details.from_teacher}
                                    </h3>
                                    <h3 class="h6 mb-2" id="score-card-${score_details.score_id}-homework-section-createdat">
                                        <i class="bi bi-clock text-primary"></i>
                                        <small id="score-card-${score_details.score_id}-homework-section-createdat">تاریخ ثبت : ${score_details.created_at}</small>
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    document.getElementById("last-fifty-score-cards-div").insertAdjacentHTML("beforeend", cardHtml);
                })
            }
        })
    }
}

export function lastFiftyComments(global_data){

    const accessToken = localStorage.getItem("accessToken");
    const requestHeaders = new Headers();
    requestHeaders.append("Authorization", "Bearer " + String(accessToken));

    const requestOptions = {
        method: "GET",
        headers: requestHeaders,
        redirect: "follow"
    };

    async function getLastFiftyComments() {
        const response = await fetch(BACKEND_BASE_URL+"/comment/all/", requestOptions);
        const data = await response.json();
        return data.data;
    }

    const response = getLastFiftyComments();
    if (global_data.is_teacher===true){
        response.then(response_obj=>{
            if(response_obj.length===0){
                const noCommentHtml = `
                <div class="empty-state text-center">
                    <div class="icon-wrapper">
                        <i class="bi bi-envelope-open text-muted display-3"></i>
                    </div>
                    <h3 class="title mt-3">تا کنون هیچ پیامی توسط شما ثبت نشده است!!</h3>
                    <h1 class="display-5 mb-3 text-center">
                        <button id="create-comment-btn" class="btn btn-primary mt-2" onclick="openCreateCommentModal()">ثبت پیام جدید</button>
                    </h1>
                </div>`;
                document.getElementById("last-fifty-comments-cards-div").insertAdjacentHTML("beforeend", noCommentHtml);
            }
            else {
                const headerHtml = `
                <header class="mb-4">
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-envelope text-primary"></i>
                        اخرین پیام های ثبت شده
                    </h1>
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-envelope-plus-fill text-primary"></i>
                        <button id="create-comment-btn" class="btn btn-primary" onclick="openCreateCommentModal()">ثبت پیام جدید</button>
                    </h1>
                    <input type="text" id="comments-search-bar" class="form-control" placeholder="جستجو بر اساس نام دانش‌آموز" onkeyup="searchCommentCards()"><br>
                </header>`;
                document.getElementById("last-fifty-comments-header-text").insertAdjacentHTML("afterbegin", headerHtml);

                response_obj.forEach(comment_details=>{
                    const cardHtml = `
                    <div class="col-md-6" id="comment-card-${comment_details.comment_id}">
                        <div class="card h-100 shadow-sm" id="comment-card-shadow-sm-${comment_details.comment_id}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <button class="btn btn-primary btn-sm mt-2" id="comment-card-submit-button-${comment_details.comment_id}" onclick="openEditCommentModal(${comment_details.comment_id})">ویرایش</button>
                                    <h2 class="h4 mb-0" id="comment-student-name">${comment_details.to_student}</h2>
                                </div>
                                <div class="homework-section">
                                    <h3 class="h6 mb-2" id="comment-card-${comment_details.comment_id}-homework-section-comment-description">
                                        <i class="bi bi-chat-square-dots text-muted" id="comment-card-${comment_details.comment_id}-homework-section-icon-comment-description"></i>
                                        <span class="text-muted">پیام :</span> <span class="text-dark" id="comment-card-${comment_details.comment_id}-comment-text">${comment_details.description.replace(/\r\n|\n/g, "<br>")}</span>
                                    </h3>
                                    <h3 class="h6 mb-2" id="comment-card-${comment_details.comment_id}-homework-section-message-check">
                                        <i class="bi bi-envelope-${comment_details.checked ? "check" : "dash"} text-muted" id="comment-card-${comment_details.comment_id}-homework-section-icon-message-check"></i>
                                        <span class="text-muted">پیام دیده شده است :</span> <span class="text-${comment_details.checked ? "primary" : "muted"}">${comment_details.checked ? "بله" : "خیر"}</span>
                                    </h3>
                                    <h3 class="h6 mb-2" id="comment-card-${comment_details.comment_id}-homework-section-createdat">
                                        <i class="bi bi-clock text-muted"></i>
                                        <span class="text-muted">تاریخ ثبت :</span> <span class="text-dark">${comment_details.created_at}</span>
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    document.getElementById("last-fifty-comments-cards-div").insertAdjacentHTML("beforeend", cardHtml);
                })
            }
        })

        async function getTeacherStudents() {
            const response = await fetch(BACKEND_BASE_URL + "/users/teacher/classes/", requestOptions);
            const data = await response.json();
            return data;
        }

        let students = [];
        let studentIds = new Set();

        getTeacherStudents().then(response_obj => {
            response_obj.forEach(class_details => {
                class_details.students.forEach(student => {
                    if (!studentIds.has(student.student_id)) {
                        studentIds.add(student.student_id);
                        students.push(student);
                    }
                });
            });

            const studentOptions = `
                <option value="" disabled selected>انتخاب دانش‌آموز</option>
                ${students.map(student => `<option value="${student.student_id}">${student.first_name} ${student.last_name}</option>`).join('')}
            `;

            const formHtml = `
                <div data-mdb-input-init class="form-outline mb-4">
                    <label class="form-label" for="create-comment-student-select">انتخاب دانش‌آموز:</label>
                    <select id="create-comment-student-select" class="form-control">
                        ${studentOptions}
                    </select>
                </div>
            `;

            document.getElementById("create-comment-modal-form").insertAdjacentHTML("afterbegin", formHtml);
        });

    }
    else{
        response.then(response_obj=>{
            if(response_obj.length===0){
                const noCommentHtml = `
                <div class="empty-state text-center">
                    <div class="icon-wrapper">
                        <i class="bi bi-envelope-open text-muted display-3"></i>
                    </div>
                    <h3 class="title mt-3">تا کنون هیچ پیامی برای شما ثبت نشده است!!</h3>
                </div>`;
                document.getElementById("last-fifty-comments-cards-div").insertAdjacentHTML("beforeend", noCommentHtml);
            }
            else {
                const headerHtml = `
                <header class="mb-4">
                    <h1 class="display-5 mb-3 text-center">
                        <i class="bi bi-envelope text-primary"></i>
                        اخرین پیام های دریافت شده
                    </h1>
                </header>`;
                document.getElementById("last-fifty-comments-header-text").insertAdjacentHTML("afterbegin", headerHtml);

                response_obj.forEach(comment_details=>{
                    const cardHtml = `
                    <div class="col-md-6" id="comment-card-${comment_details.comment_id}">
                        <div class="card h-100 shadow-sm" id="comment-card-shadow-sm-${comment_details.comment_id}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h2 class="h4 mb-0" id="comment-student-name">${comment_details.from_teacher}</h2>
                                </div>
                                <div class="homework-section">
                                    <h3 class="h6 mb-2" id="comment-card-${comment_details.comment_id}-homework-section-comment-description">
                                        <i class="bi bi-chat-square-dots text-muted" id="comment-card-${comment_details.comment_id}-homework-section-icon-comment-description"></i>
                                        <span class="text-muted">پیام :</span> <span class="text-dark">${comment_details.description.replace(/\r\n|\n/g, "<br>")}</span>
                                    </h3>
                                    <h3 class="h6 mb-2" id="comment-card-${comment_details.comment_id}-homework-section-createdat">
                                        <i class="bi bi-clock text-muted"></i>
                                        <span class="text-muted">تاریخ ثبت :</span> <span class="text-dark">${comment_details.created_at}</span>
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    document.getElementById("last-fifty-comments-cards-div").insertAdjacentHTML("beforeend", cardHtml);
                })
            }
        })
    }
}