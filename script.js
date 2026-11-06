(function () {
    const storageKey = "sptpSessionRequests";
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
            course: "هياكل بيانات (CS201)",
            proposedTime: "الإثنين الساعة 3 مساءً",
            tutorName: "عبد الرحمن عصفور",
            status: "مقبول"
        },
        {
            studentName: "نورة سالم",
            course: "رياضيات متقطعة (MATH102)",
            proposedTime: "الخميس الساعة 11 صباحاً",
            tutorName: "عمر خالد",
            status: "مرفوض"
        },
        {
            studentName: "يوسف حسن",
            course: "برمجة 1 (CS101)",
            proposedTime: "الثلاثاء الساعة 5 مساءً",
            tutorName: "محمد الابراهيم",
            status: "قيد الانتظار"
        }
    ];

    const requestsList = document.getElementById("incomingRequestsList");
    const statusFilter = document.getElementById("requestStatusFilter");
    const navigationLinks = document.querySelectorAll(".nav-link");
    let requests = [];
    let storageError = "";

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

        const badge = document.createElement("span");
        badge.className = "request-status";
        if (request.status === "قيد الانتظار") {
            badge.classList.add("request-status--pending");
        } else if (request.status === "مقبول") {
            badge.classList.add("request-status--accepted");
        } else {
            badge.classList.add("request-status--rejected");
        }
        badge.textContent = request.status;
        card.appendChild(badge);
        return card;
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

    function showCurrentPage() {
        const currentPage = window.location.hash === "#incomingRequests"
            ? "incomingRequests"
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
            return true;
        } catch (error) {
            requests.pop();
            console.error("Unable to save tutoring request.", error);
            storageError = "تعذر حفظ الطلب الوارد في التخزين المحلي.";
            renderRequests();
            return false;
        }
    };

    requests = loadRequests();
    statusFilter.addEventListener("change", renderRequests);
    window.addEventListener("hashchange", showCurrentPage);
    renderRequests();
    showCurrentPage();
})();
