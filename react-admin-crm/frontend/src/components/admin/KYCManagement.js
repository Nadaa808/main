/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import './KYCManagement.css';

const KYCManagement = () => {
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

    const [detailModal, setDetailModal] = useState({ open: false, submission: null });
    const [actionModal, setActionModal] = useState({ open: false, submission: null, action: null });
    const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });

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
            const res = await fetch(`/api/admin/kyc/submissions?${params}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error('Fetch failed');
            const data = await res.json();
            setFilteredSubmissions(data.data.submissions);
            setTotalPages(data.data.pagination.totalPages);
            setStats(data.data.stats);
        } catch (e) {
            console.error(e);
            showNotification('Failed to fetch submissions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveReject = async(id, action, reason = '') => {
        try {
            const res = await fetch(`/api/admin/kyc/submission/${id}/${action}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason, adminId: localStorage.getItem('adminId') || 'admin_001' })
            });
            if (!res.ok) throw new Error();
            showNotification(`Submission ${action}d`, 'success');
            fetchSubmissions();
            closeModal('action');
        } catch (e) {
            console.error(e);
            showNotification(`Failed to ${action} submission`, 'error');
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ open: true, message, type });
        setTimeout(() => setNotification({ open: false, message: '', type: 'success' }), 3000);
    };

    const openModal = (kind, payload = null) => {
        if (kind === 'detail') setDetailModal({ open: true, submission: payload });
        else setActionModal({ open: true, submission: payload.submission, action: payload.action });
    };

    const closeModal = (kind) => {
        if (kind === 'detail') setDetailModal({ open: false, submission: null });
        else setActionModal({ open: false, submission: null, action: null });
    };

    const doExport = async() => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/kyc/export', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'kyc_submissions.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            showNotification('Export failed', 'error');
        }
    };

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
        onClick = { fetchSubmissions } > 🔄Refresh <
        /button> <
        button className = "btn btn-outline"
        onClick = { doExport } > 📥Export <
        /button> < /
        div > <
        /div> < /
        div >

        { /* Table */ } <
        div className = "table-container" > {
            loading ? ( <
                div className = "loading" >
                <
                div className = "spinner" / >
                <
                /div>
            ) : ( <
                SubmissionsTable submissions = { filteredSubmissions }
                onViewDetails = {
                    (s) => openModal('detail', s)
                }
                onAction = {
                    (s, a) => openModal('action', { submission: s, action: a })
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

// ----------------- Child components ------------------
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
            th > User < /th> <
            th > Type < /th> <
            th > Status < /th> <
            th > Verification < /th> <
            th > Submitted < /th> <
            th > Actions < /th> < /
            tr > <
            /thead> <
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
                        div className = "user-details" >
                        <
                        h4 > { `${s.user.firstName} ${s.user.lastName}` } < /h4> <
                        p > { s.user.email } < /p> < /
                        div > <
                        /div> < /
                        td > <
                        td className = "table-cell" >
                        <
                        span className = "type-chip" > { s.submissionType } < /span> < /
                        td > <
                        td className = "table-cell" >
                        <
                        span className = { `status-chip ${getStatusClass(s.status)}` } > { s.status.replace('_', ' ') } < /span> < /
                        td > <
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
                            title = "Reject" > ❌ < /button> < /
                            >
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

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);

    return ( <
            div className = "pagination" >
            <
            button className = "page-btn"
            onClick = {
                () => onPageChange(currentPage - 1)
            }
            disabled = { currentPage === 1 } > ‹ < /button> {
            pages.map((p) => ( <
                button key = { p }
                className = { `page-btn ${p === currentPage ? 'active' : ''}` }
                onClick = {
                    () => onPageChange(p)
                } > { p } <
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
        onClick = { onClose } > × < /button> < /
        div > <
        div className = "modal-content" >
        <
        div className = "info-section" >
        <
        h4 > User Information < /h4> <
        div className = "info-item" >
        <
        span className = "info-label" > Name < /span> <
        span className = "info-value" > { `${submission.user.firstName} ${submission.user.lastName}` } < /span> < /
        div > <
        div className = "info-item" >
        <
        span className = "info-label" > Email < /span> <
        span className = "info-value" > { submission.user.email } < /span> < /
        div > <
        div className = "info-item" >
        <
        span className = "info-label" > Wallet < /span> <
        span className = "info-value" > { submission.walletAddress || 'Not provided' } < /span> < /
        div > <
        /div> <
        div className = "info-section" >
        <
        h4 > Submission Details < /h4> <
        div className = "info-item" >
        <
        span className = "info-label" > Type < /span> <
        span className = "info-value" > { submission.submissionType } < /span> < /
        div > <
        div className = "info-item" >
        <
        span className = "info-label" > Status < /span> <
        span className = "info-value" > { submission.status } < /span> < /
        div > <
        div className = "info-item" >
        <
        span className = "info-label" > Verification < /span> <
        span className = "info-value" > { submission.verificationType || 'Pending' } < /span> < /
        div > <
        div className = "info-item" >
        <
        span className = "info-label" > Submitted < /span> <
        span className = "info-value" > { new Date(submission.createdAt).toLocaleString() } < /span> < /
        div > {
            submission.rejectionReason && ( <
                div className = "info-item" >
                <
                span className = "info-label" > Rejection Reason < /span> <
                span className = "info-value" > { submission.rejectionReason } < /span> < /
                div >
            )
        } <
        /div> < /
        div > <
        /div> < /
        div >
    );
};

const ActionModal = ({ open, submission, action, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    if (!open || !submission) return null;
    const confirm = () => {
        if (action === 'reject' && !reason.trim()) {
            alert('Provide reason');
            return;
        }
        onConfirm(submission.id, action, reason);
        setReason('');
    };
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
        onClick = { onClose } > × < /button> < /
        div > <
        div style = {
            { marginBottom: 24 }
        } >
        <
        p style = {
            { marginBottom: 16, color: '#7f8c8d' }
        } >
        User: { submission.user.firstName } { submission.user.lastName } <
        /p> <
        label style = {
            { display: 'block', marginBottom: 8, fontWeight: 500 }
        } > { action === 'approve' ? 'Approval' : 'Rejection' }
        Reason: < /label> <
        textarea value = { reason }
        onChange = {
            (e) => setReason(e.target.value)
        }
        style = {
            {
                width: '100%',
                padding: 12,
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                resize: 'vertical',
                minHeight: 100
            }
        }
        placeholder = { `Enter reason for ${action}...` }
        required = { action === 'reject' }
        /> < /
        div > <
        div style = {
            { display: 'flex', gap: 12, justifyContent: 'flex-end' }
        } >
        <
        button className = "btn btn-outline"
        onClick = { onClose } >
        Cancel <
        /button> <
        button className = { `btn ${action === 'approve' ? 'btn-primary' : 'btn-reject'}` }
        onClick = { confirm }
        disabled = { action === 'reject' && !reason.trim() } > { action === 'approve' ? 'Approve' : 'Reject' } <
        /button> < /
        div > <
        /div> < /
        div >
    );
};

const Notification = ({ message, type, onClose }) => ( <
    div className = "notification"
    style = {
        { background: type === 'success' ? '#27ae60' : '#e74c3c', color: '#fff' }
    } > { message } <
    button onClick = { onClose }
    style = {
        { background: 'none', border: 'none', color: '#fff', marginLeft: 12, cursor: 'pointer' }
    } > × < /button> < /
    div >
);

export default KYCManagement;