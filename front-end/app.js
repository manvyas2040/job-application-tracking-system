// API Configuration
const API_URL = 'http://localhost:8000';

// XSS Protection
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Helper Functions
function getToken() {
    return localStorage.getItem('access_token');
}

function setToken(token) {
    localStorage.setItem('access_token', token);
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

// API Call Helper
async function apiCall(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401 && !options.skipAuth) {
            // Token expired, try to refresh
            const refreshed = await refreshToken();
            if (refreshed) {
                // Retry the original request
                headers['Authorization'] = `Bearer ${getToken()}`;
                const retryResponse = await fetch(`${API_URL}${endpoint}`, {
                    ...options,
                    headers,
                });
                if (!retryResponse.ok) {
                    throw new Error(`HTTP ${retryResponse.status}`);
                }
                return await retryResponse.json();
            } else {
                logout();
                return null;
            }
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Authentication Functions
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    hideError('register-error');
    document.getElementById('register-success').style.display = 'none';

    try {
        await apiCall('/auth/register', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ name, email, password, role }),
        });

        showSuccess('register-success', 'Registration successful! Please login.');
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        
        // Switch to login tab after 2 seconds
        setTimeout(() => showTab('login'), 2000);
    } catch (error) {
        showError('register-error', error.message);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    hideError('login-error');

    try {
        // FastAPI OAuth2 expects form data, not JSON
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();
        setToken(data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Decode token to get user info
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        setUser({
            user_id: payload.sub,
            email: email,
            role: payload.role,
        });

        window.location.href = 'dashboard.html';
    } catch (error) {
        showError('login-error', error.message);
    }
}

async function refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return false;

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refresh }),
        });

        if (!response.ok) return false;

        const data = await response.json();
        setToken(data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        return true;
    } catch {
        return false;
    }
}

// Jobs Functions
async function loadJobs() {
    const container = document.getElementById('jobs-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading jobs...</p></div>';

    try {
        const data = await apiCall('/jobs');
        const jobs = data.items || [];
        
        if (jobs.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:40px;color:#64748b;">No jobs available</p>';
            return;
        }

        container.innerHTML = jobs.map(job => `
            <div class="job-card" onclick="viewJob(${parseInt(job.job_id)})">
                <h3>${escapeHtml(job.job_title)}</h3>
                <p>${escapeHtml(job.job_description.substring(0, 150))}${job.job_description.length > 150 ? '...' : ''}</p>
                <div class="job-meta">
                    <span class="badge badge-${escapeHtml(job.job_status)}">${escapeHtml(job.job_status)}</span>
                    <span class="badge badge-draft">${escapeHtml(job.department)}</span>
                    <span class="badge badge-draft">Exp: ${parseInt(job.experience_required)} years</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p style="color:red;text-align:center;padding:40px;">Error: ${error.message}</p>`;
    }
}

async function viewJob(jobId) {
    window.location.href = `job-detail.html?id=${jobId}`;
}

async function loadApplications() {
    const container = document.getElementById('applications-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading applications...</p></div>';

    try {
        const data = await apiCall('/applications');
        const applications = data.items || [];
        
        if (applications.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:40px;color:#64748b;">No applications found</p>';
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Application ID</th>
                        <th>Job ID</th>
                        <th>Status</th>
                        <th>Applied Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${applications.map(app => `
                        <tr>
                            <td>${parseInt(app.application_id)}</td>
                            <td>${parseInt(app.job_id)}</td>
                            <td><span class="badge badge-${escapeHtml(app.application_status)}">${escapeHtml(app.application_status)}</span></td>
                            <td>${new Date(app.applied_date).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="viewApplication(${parseInt(app.application_id)})">View</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = `<p style="color:red;text-align:center;padding:40px;">Error: ${error.message}</p>`;
    }
}

async function createJob(event) {
    event.preventDefault();
    
    const title = document.getElementById('job-title').value;
    const description = document.getElementById('job-description').value;
    const department = document.getElementById('job-department').value;
    const experience = parseInt(document.getElementById('job-experience').value);

    // Validate inputs
    if (!title || !description || !department || isNaN(experience)) {
        showError('job-error', 'Please fill in all fields');
        return;
    }

    try {
        const user = getUser();
        
        await apiCall('/jobs', {
            method: 'POST',
            body: JSON.stringify({
                job_title: title,
                job_description: description,
                department: department,
                experience_required: experience,
            }),
        });

        showSuccess('job-success', 'Job created successfully!');
        
        // Clear form
        document.getElementById('job-title').value = '';
        document.getElementById('job-description').value = '';
        document.getElementById('job-department').value = '';
        document.getElementById('job-experience').value = '';
        
        // Hide success message and close modal after 2 seconds
        setTimeout(() => {
            closeModal('create-job-modal');
            loadJobs();
        }, 1500);
    } catch (error) {
        showError('job-error', 'Error: ' + error.message);
    }
}

async function applyToJob(jobId) {
    const user = getUser();
            
    // Check if candidate has profile
    if (user.role === 'candidate') {
        try {
            const response = await fetch(`${API_URL}/candidate/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 404) {
                alert('Please complete your profile before applying for jobs');
                window.location.href = 'create-profile.html';
                return;
            }
        } catch (error) {
            alert('Error checking profile: ' + error.message);
            return;
        }
    }

    if (!confirm('Are you sure you want to apply for this job?')) return;

    try {
        await apiCall('/applications', {
            method: 'POST',
            body: JSON.stringify({ job_id: jobId }),
        });

        alert('Application submitted successfully!');
        window.location.href = 'applications.html';
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Modal Functions
function openModal(modalId) {
    // Clear error/success messages when opening modal
    const errorEl = document.getElementById(modalId.replace('-modal', '-error'));
    const successEl = document.getElementById(modalId.replace('-modal', '-success'));
    
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';
    
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    // Clear error/success messages when closing modal
    const errorEl = document.getElementById(modalId.replace('-modal', '-error'));
    const successEl = document.getElementById(modalId.replace('-modal', '-success'));
    
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';
    
    document.getElementById(modalId).classList.remove('active');
}

// Check authentication on protected pages
function requireAuth() {
    if (!getToken()) {
        window.location.href = 'index.html';
    }
}

// Check if candidate profile exists and redirect if needed
async function checkCandidateProfile() {
    const user = getUser();
    
    // Only check for candidates
    if (user && user.role === 'candidate') {
        // Don't check if already on profile pages or login/register
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'create-profile.html' || currentPage === 'profile.html' || 
            currentPage === 'index.html' || currentPage === '') {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/candidate/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 404) {
                // Profile doesn't exist, redirect to create profile
                alert('Please complete your profile before continuing');
                window.location.href = 'create-profile.html';
                return;
            }

            if (response.ok) {
                // Profile exists, mark as complete
                const updatedUser = { ...user, profile_complete: true };
                setUser(updatedUser);
            }
        } catch (error) {
            console.error('Error checking profile:', error);
        }
    }
}

// Load notification count
async function loadNotificationCount() {
    const user = getUser();
    if (user && user.role === 'candidate') {
        try {
            const notifications = await apiCall('/notifications');
            const unread = notifications.filter(n => !n.is_read).length;
            
            const badge = document.getElementById('notification-badge');
            if (badge && unread > 0) {
                badge.textContent = unread;
                badge.style.display = 'inline-block';
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }
}
