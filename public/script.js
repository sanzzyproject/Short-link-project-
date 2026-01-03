document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('shortenForm');
    const providerSelect = document.getElementById('providerSelect');
    const suffixGroup = document.getElementById('suffixGroup');
    const suffixInput = document.getElementById('suffixInput');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');
    
    const resultCard = document.getElementById('resultCard');
    const resultLink = document.getElementById('resultLink');
    const copyBtn = document.getElementById('copyBtn');
    const copyText = copyBtn.querySelector('.copy-text');
    const errorToast = document.getElementById('errorToast');
    const errorText = document.getElementById('errorText');

    // Toggle Suffix Input based on Provider
    providerSelect.addEventListener('change', (e) => {
        if (e.target.value === 'tinube') {
            suffixGroup.classList.remove('disabled');
            suffixInput.disabled = false;
            suffixInput.focus();
        } else {
            suffixGroup.classList.add('disabled');
            suffixInput.disabled = true;
            suffixInput.value = '';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset State
        hideError();
        resultCard.classList.add('hidden');
        setLoading(true);

        const url = document.getElementById('urlInput').value.trim();
        const provider = providerSelect.value;
        const suffix = suffixInput.value.trim();

        // Validasi Front-end
        if (!url) {
            showError('Mohon masukkan URL yang valid.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, provider, suffix })
            });

            // FIX UTAMA: Cek tipe konten sebelum parse JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                // Jika server mengembalikan HTML error (seperti 500 Vercel Error)
                const text = await response.text();
                console.error("Server HTML Error:", text); 
                throw new Error("Terjadi kesalahan server (Internal Server Error).");
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Gagal memendekkan link.');
            }

            showResult(data.url);

        } catch (error) {
            console.error(error);
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    // Copy Functionality
    copyBtn.addEventListener('click', () => {
        if (!resultLink.href) return;
        
        navigator.clipboard.writeText(resultLink.href).then(() => {
            const originalText = copyText.textContent;
            copyText.textContent = 'Disalin!';
            copyBtn.style.background = '#ECFDF5';
            copyBtn.style.color = '#059669';
            
            setTimeout(() => {
                copyText.textContent = originalText;
                copyBtn.style.background = 'white';
                copyBtn.style.color = 'var(--primary)';
            }, 2000);
        });
    });

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            btnText.style.display = 'none';
            spinner.style.display = 'block';
        } else {
            btnText.style.display = 'block';
            spinner.style.display = 'none';
        }
    }

    function showResult(url) {
        resultLink.href = url;
        resultLink.textContent = url;
        resultCard.classList.remove('hidden');
    }

    function showError(msg) {
        errorText.textContent = msg;
        errorToast.classList.remove('hidden');
        // Auto hide error after 5 seconds
        setTimeout(() => {
            errorToast.classList.add('hidden');
        }, 5000);
    }

    function hideError() {
        errorToast.classList.add('hidden');
    }
});
