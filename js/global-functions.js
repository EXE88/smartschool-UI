function showMessage(text, timeout, class_name) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert ' + class_name + ' alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.style.position = 'fixed';
    alertDiv.style.zIndex = '2051';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.innerHTML = text;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), timeout);
}

async function sendRequest(url, options = {}) {
    const mergedOptions = Object.assign({}, options);
    try {
        const response = await fetch(url, mergedOptions);
        const status_code = response.status;
        let data = {};
        try {
            data = await response.json();
        } catch (e) {
        }
        return { data, status_code };
    } catch (e) {
        return { data: {}, status_code: 0 };
    }
}

