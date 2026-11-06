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
