document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('shortenForm');
    const providerSelect = document.getElementById('providerSelect');
    const suffixInput = document.getElementById('suffixInput');
    const suffixContainer = document.getElementById('suffixContainer');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    
    const resultContainer = document.getElementById('resultContainer');
    const resultLink = document.getElementById('resultLink');
    const copyBtn = document.getElementById('copyBtn');
    const errorContainer = document.getElementById('errorContainer');

    // Handle Provider Change
    providerSelect.addEventListener('change', (e) => {
        if (e.target.value === 'tinube') {
            suffixContainer.style.opacity = '1';
            suffixContainer.style.pointerEvents = 'auto';
            suffixInput.disabled = false;
        } else {
            suffixContainer.style.opacity = '0.5';
            suffixContainer.style.pointerEvents = 'none';
            suffixInput.disabled = true;
            suffixInput.value = '';
        }
    });

    // Handle Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset UI
        errorContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');
        setLoading(true);

        const url = document.getElementById('urlInput').value.trim();
        const provider = providerSelect.value;
        const suffix = suffixInput.value.trim();

        // Basic Validation
        if (!url.startsWith('http')) {
            showError('URL harus dimulai dengan http:// atau https://');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, provider, suffix })
            });

            const data = await response.json();

            if (data.success) {
                showResult(data.url);
            } else {
                throw new Error(data.error || 'Terjadi kesalahan misterius.');
            }

        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    // Copy Function
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(resultLink.href).then(() => {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
            }, 2000);
        });
    });

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            loader.style.display = 'block';
        } else {
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            loader.style.display = 'none';
        }
    }

    function showResult(url) {
        resultLink.href = url;
        resultLink.textContent = url;
        resultContainer.classList.remove('hidden');
    }

    function showError(msg) {
        errorContainer.textContent = msg;
        errorContainer.classList.remove('hidden');
    }
});
