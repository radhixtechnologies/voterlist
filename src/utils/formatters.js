export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

export function getRoleBadge(role) {
  switch (role) {
    case 'SUPER_ADMIN':
      return { label: 'Super Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'ADMIN':
      return { label: 'Admin', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'ASSOCIATE_MEMBER':
      return { label: 'Associate Member', color: 'bg-teal-100 text-teal-800 border-teal-200' };
    case 'VOTER':
      return { label: 'Voter', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    default:
      return { label: role || 'Unknown', color: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
}

export function getStatusBadge(status) {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'INACTIVE':
      return { label: 'Inactive', color: 'bg-slate-100 text-slate-600 border-slate-300' };
    case 'FLAGGED':
    case 'SUSPENDED':
      return { label: status, color: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status || 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
}

