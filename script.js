(function () {
    const storageKey = "sptpSessionRequests";
    const studentNameKey = "sptpStudentName";
    const validStatuses = ["قيد الانتظار", "مقبول", "مرفوض"];
    const sampleRequests = [
        {
            studentName: "سارة أحمد",
            course: "برمجة 1 (CS101)",
            proposedTime: "الأحد القادم الساعة 4 عصراً",
            tutorName: "محمد الابراهيم",
            status: "قيد الانتظار"
        },
        {
            studentName: "خالد علي",
            course: "برمجة 1 (CS101)",
            proposedTime: "الأحد القادم الساعة 4 عصراً",
            tutorName: "محمد الابراهيم",
            status: "قيد الانتظار"
        },
        {
            studentName: "نورة سالم",
            course: "برمجة 1 (CS101)",
            proposedTime: "الثلاثاء الساعة 5 مساءً",
            tutorName: "محمد الابراهيم",
            status: "قيد الانتظار"
        },
        {
            studentName: "يوسف حسن",
            course: "برمجة 1 (CS101)",
            proposedTime: "الخميس الساعة 4 عصراً",
            tutorName: "محمد الابراهيم",
            status: "مقبول"
        },
        {
            studentName: "ريم محمود",
            course: "هياكل بيانات (CS201)",
            proposedTime: "الإثنين الساعة 2 مساءً",
            tutorName: "عبد الرحمن عصفور",
            description: "مراجعة القوائم المرتبطة",
            status: "مرفوض"
        }
    ];

    const requestsList = document.getElementById("incomingRequestsList");
    const statusFilter = document.getElementById("requestStatusFilter");
    const myRequestsList = document.getElementById("myRequestsList");
    const myRequestStatusFilter = document.getElementById("myRequestStatusFilter");
    const studentIdentityForm = document.getElementById("studentIdentityForm");
    const studentIdentityInput = document.getElementById("studentIdentityInput");
    const navigationLinks = document.querySelectorAll(".nav-link");
    let requests = [];
    let storageError = "";
    let studentName = "";
    let identityStorageError = "";

    function isRequest(item) {
        return item &&
            typeof item.studentName === "string" &&
            item.studentName.trim() !== "" &&
            typeof item.course === "string" &&
            item.course.trim() !== "" &&
            typeof item.proposedTime === "string" &&
            item.proposedTime.trim() !== "" &&
            validStatuses.includes(item.status);
    }

    function loadRequests() {
        storageError = "";
        try {
            const storedRequests = localStorage.getItem(storageKey);
            if (storedRequests === null) {
                localStorage.setItem(storageKey, JSON.stringify(sampleRequests));
                return sampleRequests;
            }

            const parsedRequests = JSON.parse(storedRequests);
            if (!Array.isArray(parsedRequests) || !parsedRequests.every(isRequest)) {
                throw new Error("Stored tutoring requests have an invalid format.");
            }
            storageError = "";
            return parsedRequests;
        } catch (error) {
            console.error("Unable to load tutoring requests.", error);
            storageError = "تعذر تحميل الطلبات الواردة من التخزين المحلي.";
            return [];
        }
    }

    function createRequestCard(request) {
        const card = document.createElement("article");
        card.className = "request-card";

        const title = document.createElement("h3");
        title.textContent = request.studentName;
        card.appendChild(title);

        [
            ["المقرر:", request.course],
            ["الوقت المقترح:", request.proposedTime]
        ].forEach(([label, value]) => {
            const detail = document.createElement("p");
            const strong = document.createElement("strong");
            strong.textContent = label + " ";
            detail.append(strong, document.createTextNode(value));
            card.appendChild(detail);
        });

        card.appendChild(createStatusBadge(request.status));

        if (request.status === "قيد الانتظار") {
            const actions = document.createElement("div");
            actions.className = "request-actions";

            const acceptButton = document.createElement("button");
            acceptButton.type = "button";
            acceptButton.className = "request-action request-action--accept";
            acceptButton.textContent = "قبول";
            acceptButton.addEventListener("click", () => acceptRequest(request));

            const rejectButton = document.createElement("button");
            rejectButton.type = "button";
            rejectButton.className = "request-action request-action--reject";
            rejectButton.textContent = "رفض";
            rejectButton.addEventListener("click", () => rejectRequest(request));

            actions.append(acceptButton, rejectButton);
            card.appendChild(actions);
        }

        return card;
    }

    function createStatusBadge(status) {
        const badge = document.createElement("span");
        badge.className = "request-status";
        if (status === "قيد الانتظار") {
            badge.classList.add("request-status--pending");
        } else if (status === "مقبول") {
            badge.classList.add("request-status--accepted");
        } else {
            badge.classList.add("request-status--rejected");
        }
        badge.textContent = status;
        return badge;
    }

    function createStudentRequestCard(request) {
        const card = document.createElement("article");
        card.className = "request-card";

        const title = document.createElement("h3");
        title.textContent = request.tutorName || "مدرس";
        card.appendChild(title);

        [
            ["المقرر:", request.course],
            ["الوقت المقترح:", request.proposedTime]
        ].forEach(([label, value]) => {
            const detail = document.createElement("p");
            const strong = document.createElement("strong");
            strong.textContent = label + " ";
            detail.append(strong, document.createTextNode(value));
            card.appendChild(detail);
        });

        if (typeof request.description === "string" && request.description.trim()) {
            const description = document.createElement("p");
            const label = document.createElement("strong");
            label.textContent = "وصف الصعوبة: ";
            description.append(label, document.createTextNode(request.description));
            card.appendChild(description);
        }

        card.appendChild(createStatusBadge(request.status));
        return card;
    }

    function normalizeProposedTime(time) {
        return time.trim().replace(/\s+/g, " ").toLocaleLowerCase();
    }

    function hasAcceptedTimeConflict(request) {
        const proposedTime = normalizeProposedTime(request.proposedTime);
        return typeof request.tutorName === "string" &&
            request.tutorName.trim() !== "" &&
            requests.some(existingRequest =>
                existingRequest !== request &&
                existingRequest.status === "مقبول" &&
                existingRequest.tutorName === request.tutorName &&
                normalizeProposedTime(existingRequest.proposedTime) === proposedTime
            );
    }

    function updateRequestStatus(request, status) {
        const previousStatus = request.status;
        request.status = status;
        try {
            localStorage.setItem(storageKey, JSON.stringify(requests));
            storageError = "";
            renderRequests();
            renderMyRequests();
        } catch (error) {
            request.status = previousStatus;
            console.error("Unable to update tutoring request status.", error);
            alert("تعذر حفظ تحديث حالة الطلب. يرجى المحاولة مرة أخرى.");
        }
    }

    function acceptRequest(request) {
        if (hasAcceptedTimeConflict(request)) {
            alert("لا يمكن قبول الطلب لوجود جلسة مقبولة أخرى في نفس الوقت");
            return;
        }
        updateRequestStatus(request, "مقبول");
    }

    function rejectRequest(request) {
        if (!window.confirm("هل أنت متأكد من رفض هذا الطلب؟")) {
            return;
        }
        updateRequestStatus(request, "مرفوض");
    }

    function renderRequests() {
        requestsList.replaceChildren();
        if (storageError) {
            const errorMessage = document.createElement("p");
            errorMessage.className = "requests-empty";
            errorMessage.setAttribute("role", "alert");
            errorMessage.textContent = storageError;
            requestsList.appendChild(errorMessage);
            return;
        }

        const selectedStatus = statusFilter.value;
        const visibleRequests = selectedStatus === "الكل"
            ? requests
            : requests.filter(request => request.status === selectedStatus);

        if (visibleRequests.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "requests-empty";
            emptyMessage.textContent = "لا توجد طلبات واردة حالياً";
            requestsList.appendChild(emptyMessage);
            return;
        }

        visibleRequests.forEach(request => {
            requestsList.appendChild(createRequestCard(request));
        });
    }

    function renderMyRequests() {
        myRequestsList.replaceChildren();
        if (storageError) {
            const errorMessage = document.createElement("p");
            errorMessage.className = "requests-empty";
            errorMessage.setAttribute("role", "alert");
            errorMessage.textContent = storageError;
            myRequestsList.appendChild(errorMessage);
            return;
        }
        if (identityStorageError) {
            const errorMessage = document.createElement("p");
            errorMessage.className = "requests-empty";
            errorMessage.setAttribute("role", "alert");
            errorMessage.textContent = identityStorageError;
            myRequestsList.appendChild(errorMessage);
            return;
        }
        if (!studentName) {
            const prompt = document.createElement("p");
            prompt.className = "requests-empty";
            prompt.textContent = "اكتب اسمك لعرض طلباتك.";
            myRequestsList.appendChild(prompt);
            return;
        }

        const selectedStatus = myRequestStatusFilter.value;
        const visibleRequests = requests.filter(request =>
            request.studentName.trim() === studentName &&
            (selectedStatus === "الكل" || request.status === selectedStatus)
        );

        if (visibleRequests.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "requests-empty";
            emptyMessage.textContent = "لا توجد طلبات حتى الآن";
            myRequestsList.appendChild(emptyMessage);
            return;
        }

        visibleRequests.forEach(request => {
            myRequestsList.appendChild(createStudentRequestCard(request));
        });
    }

    function loadStudentName() {
        try {
            studentName = (localStorage.getItem(studentNameKey) || "").trim();
            identityStorageError = "";
        } catch (error) {
            console.error("Unable to load student identity.", error);
            identityStorageError = "تعذر تحميل اسم الطالب من التخزين المحلي.";
        }
        studentIdentityInput.value = studentName;
        const requestNameInput = document.getElementById("studentName");
        if (requestNameInput) {
            requestNameInput.value = studentName;
        }
    }

    function refreshRequests() {
        requests = loadRequests();
        loadStudentName();
        renderRequests();
        renderMyRequests();
    }

    window.getStudentIdentity = function () {
        return studentName;
    };

    window.setStudentIdentity = function (name) {
        const normalizedName = typeof name === "string" ? name.trim() : "";
        if (!normalizedName) {
            return false;
        }

        try {
            localStorage.setItem(studentNameKey, normalizedName);
            studentName = normalizedName;
            identityStorageError = "";
            studentIdentityInput.value = normalizedName;
            document.getElementById("studentName").value = normalizedName;
            renderMyRequests();
            return true;
        } catch (error) {
            console.error("Unable to save student identity.", error);
            identityStorageError = "تعذر حفظ اسم الطالب في التخزين المحلي.";
            renderMyRequests();
            return false;
        }
    };

    function showCurrentPage() {
        const currentPage = window.location.hash === "#incomingRequests"
            ? "incomingRequests"
            : window.location.hash === "#myRequests"
                ? "myRequests"
                : "tutorsPage";

        document.querySelectorAll(".page-view").forEach(page => {
            page.classList.toggle("hidden", page.id !== currentPage);
        });
        navigationLinks.forEach(link => {
            if (link.dataset.page === currentPage) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    window.saveIncomingRequest = function (request) {
        if (!isRequest(request)) {
            console.error("Unable to save tutoring request: request data is invalid.");
            return false;
        }

        try {
            requests.push(request);
            localStorage.setItem(storageKey, JSON.stringify(requests));
            storageError = "";
            renderRequests();
            renderMyRequests();
            return true;
        } catch (error) {
            requests.pop();
            console.error("Unable to save tutoring request.", error);
            storageError = "تعذر حفظ الطلب الوارد في التخزين المحلي.";
            renderRequests();
            return false;
        }
    };

    studentIdentityForm.addEventListener("submit", event => {
        event.preventDefault();
        if (!window.setStudentIdentity(studentIdentityInput.value)) {
            alert("يرجى إدخال اسم صحيح وحفظه.");
        }
    });
    statusFilter.addEventListener("change", renderRequests);
    myRequestStatusFilter.addEventListener("change", renderMyRequests);
    window.addEventListener("hashchange", () => {
        refreshRequests();
        showCurrentPage();
    });
    window.addEventListener("storage", event => {
        if (event.key === storageKey || event.key === studentNameKey || event.key === null) {
            refreshRequests();
        }
    });
    window.addEventListener("focus", refreshRequests);
    refreshRequests();
    showCurrentPage();
})();
