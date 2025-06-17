/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import './KYCManagement.css';

const KYCManagement = () => {
    // State declarations
    const [submissions, setSubmissions] = useState([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

    // Modal & notification state
    const [detailModal, setDetailModal] = useState({ open: false, submission: null });
    const [actionModal, setActionModal] = useState({ open: false, submission: null, action: null });
    const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });

    // Fetch submissions on dependency change
    useEffect(() => {
        fetchSubmissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter, searchTerm]);

    const fetchSubmissions = async() => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(statusFilter !== 'ALL' && { status: statusFilter }),
                ...(searchTerm && { search: searchTerm })
            });
            const response = await fetch(`/api/admin/kyc/submissions?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch submissions');
            const data = await response.json();
            setSubmissions(data.data.submissions);
            setFilteredSubmissions(data.data.submissions);
            setTotalPages(data.data.pagination.totalPages);
            setStats(data.data.stats);
        } catch (err) {
            console.error(err);
            showNotification('Failed to fetch submissions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveReject = async(submissionId, action, reason = '') => {
        try {
            const endpoint = `/api/admin/kyc/submission/${submissionId}/${action}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason, adminId: localStorage.getItem('adminId') || 'admin_001' })
            });
            if (!response.ok) throw new Error(`Failed to ${action} submission`);
            showNotification(`Submission ${action}d successfully`, 'success');
            fetchSubmissions();
            closeModal('actionModal');
        } catch (err) {
            console.error(err);
            showNotification(`Failed to ${action} submission`, 'error');
        }
    };

    // Helper UI utilities
    const showNotification = (message, type = 'success') => {
        setNotification({ open: true, message, type });
        setTimeout(() => setNotification({ open: false, message: '', type: 'success' }), 3000);
    };

    const openModal = (modalType, data = null) => {
        if (modalType === 'detail') setDetailModal({ open: true, submission: data });
        else if (modalType === 'action') setActionModal({ open: true, submission: data.submission, action: data.action });
    };

    const closeModal = (modalType) => {
        if (modalType === 'detail') setDetailModal({ open: false, submission: null });
        else if (modalType === 'action') setActionModal({ open: false, submission: null, action: null });
    };

    // Visual helper functions
    const getStatusClass = (status) => `status-${status.toLowerCase().replace('_', '-')}`;
    const getUserInitials = (user) => user.firstName[0] + user.lastName[0];

    // Render
    return ( <
        div className = "kyc-management" > { /* Header */ } <
        header className = "kyc-header" >
        <
        div className = "header-content" >
        <
        div className = "header-title" >
        <
        div className = "header-icon" > 🔒 < /div> <
        h1 > KYC Management Dashboard < /h1> < /
        div > <
        div className = "notification-badge" >
        <
        span > 🔔 < /span> {
        stats.pending > 0 && < div className = "badge-count" > { stats.pending } < /div>} < /
        div > <
        /div> < /
        header >

        { /* Statistics */ } <
        div className = "stats-grid" >
        <
        StatCard title = "Total Submissions"
        value = { stats.total }
        icon = "👥"
        color = "#3498db" / >
        <
        StatCard title = "Pending Review"
        value = { stats.pending }
        icon = "⏳"
        color = "#f39c12" / >
        <
        StatCard title = "Approved"
        value = { stats.approved }
        icon = "✅"
        color = "#27ae60" / >
        <
        StatCard title = "Rejected"
        value = { stats.rejected }
        icon = "❌"
        color = "#e74c3c" / >
        <
        /div>

        { /* Main card */ } <
        div className = "main-card" > { /* Filters */ } <
        div className = "filters-section" >
        <
        div className = "filters-grid" >
        <
        div className = "search-container" >
        <
        span className = "search-icon" > 🔍 < /span> <
        input type = "text"
        className = "search-input"
        placeholder = "Search by name or email..."
        value = { searchTerm }
        onChange = {
            (e) => setSearchTerm(e.target.value)
        }
        /> < /
        div > <
        select className = "filter-select"
        value = { statusFilter }
        onChange = {
            (e) => setStatusFilter(e.target.value)
        } >
        <
        option value = "ALL" > All Statuses < /option> <
        option value = "PENDING" > Pending < /option> <
        option value = "APPROVED" > Approved < /option> <
        option value = "REJECTED" > Rejected < /option> <
        option value = "IN_REVIEW" > In Review < /option> < /
        select > <
        div className = "action-buttons" >
        <
        button className = "btn btn-outline"
        onClick = { fetchSubmissions } > 🔄Refresh < /button> <
        button className = "btn btn-outline"
        onClick = {
            () => window.open('/api/admin/kyc/export', '_blank')
        } > 📥Export < /button> < /
        div > <
        /div> < /
        div >

        { /* Table */ } <
        div className = "table-container" > {
            loading ? ( <
                div className = "loading" > < div className = "spinner" / > < /div>
            ) : ( <
                SubmissionsTable submissions = { filteredSubmissions }
                onViewDetails = {
                    (s) => openModal('detail', s)
                }
                onAction = {
                    (s, action) => openModal('action', { submission: s, action })
                }
                />
            )
        } <
        /div>

        { /* Pagination */ } <
        Pagination currentPage = { page }
        totalPages = { totalPages }
        onPageChange = { setPage }
        /> < /
        div >

        { /* Modals */ } <
        DetailModal open = { detailModal.open }
        submission = { detailModal.submission }
        onClose = {
            () => closeModal('detail')
        }
        /> <
        ActionModal open = { actionModal.open }
        submission = { actionModal.submission }
        action = { actionModal.action }
        onClose = {
            () => closeModal('action')
        }
        onConfirm = { handleApproveReject }
        />

        { /* Notification */ } {
            notification.open && ( <
                Notification message = { notification.message }
                type = { notification.type }
                onClose = {
                    () => setNotification({ open: false, message: '', type: 'success' })
                }
                />
            )
        } <
        /div>
    );
};

// ---- Reusable child components ----
const StatCard = ({ title, value, icon, color }) => ( <
    div className = { `stat-card stat-${color.replace('#', '')}` } >
    <
    div className = "stat-card-content" >
    <
    div >
    <
    div className = "stat-value"
    style = {
        { color }
    } > { value } < /div> <
    div className = "stat-label" > { title } < /div> < /
    div > <
    div className = "stat-icon"
    style = {
        { background: `linear-gradient(135deg, ${color}, ${color}dd)` }
    } > { icon } < /div> < /
    div > <
    /div>
);

const SubmissionsTable = ({ submissions, onViewDetails, onAction }) => {
    const getStatusClass = (status) => `status-${status.toLowerCase().replace('_', '-')}`;
    const getUserInitials = (u) => u.firstName[0] + u.lastName[0];

    if (!submissions.length) {
        return ( <
            div className = "empty-state" >
            <
            div className = "empty-state-icon" > 📋 < /div> <
            h3 > No submissions found < /h3> <
            p > Try adjusting your filters or search terms < /p> < /
            div >
        );
    }

    return ( <
            table className = "data-table" >
            <
            thead className = "table-header" >
            <
            tr >
            <
            th > User < /th><th>Type</th > < th > Status < /th><th>Verification</th > < th > Submitted < /th><th>Actions</th >
            <
            /tr> < /
            thead > <
            tbody > {
                submissions.map((s) => ( <
                        tr key = { s.id }
                        className = "table-row" >
                        <
                        td className = "table-cell" >
                        <
                        div className = "user-info" >
                        <
                        div className = "user-avatar" > { getUserInitials(s.user) } < /div> <
                        div className = "user-details" > < h4 > { s.user.firstName } { s.user.lastName } < /h4><p>{s.user.email}</p > < /div> < /
                        div > <
                        /td> <
                        td className = "table-cell" > < span className = "type-chip" > { s.submissionType } < /span></td >
                        <
                        td className = "table-cell" > < span className = { `status-chip ${getStatusClass(s.status)}` } > { s.status.replace('_', ' ') } < /span></td >
                        <
                        td className = "table-cell" > { s.verificationType || '-' } < /td> <
                        td className = "table-cell" > { new Date(s.createdAt).toLocaleDateString() } < /td> <
                        td className = "table-cell" >
                        <
                        div className = "action-buttons-cell" >
                        <
                        button className = "action-btn btn-view"
                        onClick = {
                            () => onViewDetails(s)
                        }
                        title = "View Details" > 👁️ < /button> {
                        s.status === 'PENDING' && ( <
                            >
                            <
                            button className = "action-btn btn-approve"
                            onClick = {
                                () => onAction(s, 'approve')
                            }
                            title = "Approve" > ✅ < /button> <
                            button className = "action-btn btn-reject"
                            onClick = {
                                () => onAction(s, 'reject')
                            }
                            title = "Reject" > ❌ < /button> < / >
                        )
                    } <
                    /div> < /
                    td > <
                    /tr>
                ))
        } <
        /tbody> < /
    table >
);
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
        const pages = [];
        const showPages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
        let endPage = Math.min(totalPages, startPage + showPages - 1);

        if (endPage - startPage + 1 < showPages) {
            startPage = Math.max(1, endPage - showPages + 1);
        }

        for (let i = startPage; i <= endPage; i += 1) {
            pages.push(i);
        }
        return pages;
    };

    return ( <
            div className = "pagination" >
            <
            button className = "page-btn"
            onClick = {
                () => onPageChange(currentPage - 1)
            }
            disabled = { currentPage === 1 } > ‹ < /button> {
            getPageNumbers().map((page) => ( <
                button key = { page }
                className = { `page-btn ${page === currentPage ? 'active' : ''}` }
                onClick = {
                    () => onPageChange(page)
                } > { page } <
                /button>
            ))
        } <
        button className = "page-btn"
    onClick = {
        () => onPageChange(currentPage + 1)
    }
    disabled = { currentPage === totalPages } > › < /button> < /
        div >
);
};

// DetailModal Component
const DetailModal = ({ open, submission, onClose }) => {
    if (!open || !submission) return null;

    return ( <
            div className = { `modal-overlay ${open ? 'active' : ''}` } >
            <
            div className = "modal" >
            <
            div className = "modal-header" >
            <
            h2 className = "modal-title" > KYC Submission Details < /h2> <
            button className = "modal-close"
            onClick = { onClose } > & times; < /button> < /
            div > <
            div className = "modal-content" >
            <
            div className = "info-section" >
            <
            h4 > User Information < /h4> <
            div className = "info-item" > < span className = "info-label" > Name < /span><span className="info-value">{submission.user.firstName} {submission.user.lastName}</span > < /div> <
            div className = "info-item" > < span className = "info-label" > Email < /span><span className="info-value">{submission.user.email}</span > < /div> <
            div className = "info-item" > < span className = "info-label" > Wallet < /span><span className="info-value">{submission.walletAddress || 'Not provided'}</span > < /div> < /
            div > <
            div className = "info-section" >
            <
            h4 > Submission Details < /h4> <
            div className = "info-item" > < span className = "info-label" > Type < /span><span className="info-value">{submission.submissionType}</span > < /div> <
            div className = "info-item" > < span className = "info-label" > Status < /span><span className="info-value">{submission.status}</span > < /div> <
            div className = "info-item" > < span className = "info-label" > Verification < /span><span className="info-value">{submission.verificationType || 'Pending'}</span > < /div> <
            div className = "info-item" > < span className = "info-label" > Submitted < /span><span className="info-value">{new Date(submission.createdAt).toLocaleString()}</span > < /div> {
            submission.rejectionReason && ( <
                div className = "info-item" > < span className = "info-label" > Rejection Reason < /span><span className="info-value">{submission.rejectionReason}</span > < /div>
            )
        } <
        /div> < /
        div > <
        /div> < /
        div >
);
};

// ActionModal Component
const ActionModal = ({ open, submission, action, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (action === 'reject' && !reason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        onConfirm(submission.id, action, reason);
        setReason('');
    };

    if (!open || !submission) return null;

    return ( <
        div className = { `modal-overlay ${open ? 'active' : ''}` } >
        <
        div className = "modal" >
        <
        div className = "modal-header" >
        <
        h2 className = "modal-title" > { action === 'approve' ? 'Approve' : 'Reject' }
        KYC Submission < /h2> <
        button className = "modal-close"
        onClick = { onClose } > & times; < /button> < /
        div > <
        div style = {
            { marginBottom: '24px' }
        } >
        <
        p style = {
            { marginBottom: '16px', color: '#7f8c8d' }
        } > User: { submission.user.firstName } { submission.user.lastName } < /p> <
        label style = {
            { display: 'block', marginBottom: '8px', fontWeight: '500' }
        } > { action === 'approve' ? 'Approval' : 'Rejection' }
        Reason: < /label> <
        textarea value = { reason }
        onChange = {
            (e) => setReason(e.target.value)
        }
        style = {
            { width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', resize: 'vertical', minHeight: '100px' }
        }
        placeholder = { `Enter reason for ${action}...` }
        required = { action === 'reject' }
        /> < /
        div > <
        div style = {
            { display: 'flex', gap: '12px', justifyContent: 'flex-end' }
        } >
        <
        button className = "btn btn-outline"
        onClick = { onClose } > Cancel < /button> <
        button className = { `btn ${action === 'approve' ? 'btn-primary' : 'btn-reject'}` }
        onClick = { handleConfirm }
        disabled = { action === 'reject' && !reason.trim() } > { action === 'approve' ? 'Approve' : 'Reject' } < /button> < /
        div > <
        /div> < /
        div >
    );
};

// Notification Component
const Notification = ({ message, type, onClose }) => ( <
    div className = "notification"
    style = {
        { background: type === 'success' ? '#27ae60' : '#e74c3c', color: 'white' }
    } > { message } <
    button onClick = { onClose }
    style = {
        { background: 'none', border: 'none', color: 'white', marginLeft: '12px', cursor: 'pointer' }
    } > × < /button> < /
    div >
);

export default KYCManagement;