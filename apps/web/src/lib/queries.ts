import { fetchApi } from './api';

// Query key factories
export const queryKeys = {
  contacts: {
    all: ['contacts'] as const,
    list: (params: Record<string, unknown>) => ['contacts', 'list', params] as const,
    detail: (id: string) => ['contacts', id] as const,
    graph: (id: string) => ['contacts', id, 'graph'] as const,
  },
  members: {
    all: ['members'] as const,
    detail: (id: string) => ['members', id] as const,
    contacts: (id: string) => ['members', id, 'contacts'] as const,
  },
  interactions: {
    all: ['interactions'] as const,
    list: (params: Record<string, unknown>) => ['interactions', 'list', params] as const,
  },
  graph: {
    full: ['graph', 'full'] as const,
    search: (query: string) => ['graph', 'search', query] as const,
    path: (from: string, to: string) => ['graph', 'path', from, to] as const,
    neighborhood: (id: string) => ['graph', 'neighborhood', id] as const,
  },
  admin: {
    stats: ['admin', 'stats'] as const,
    approvedMembers: ['admin', 'approved-members'] as const,
  },
  health: {
    ready: ['health', 'ready'] as const,
    queues: ['health', 'queues'] as const,
  },
  notion: {
    status: ['notion', 'status'] as const,
  },
};

// Query functions
export const api = {
  contacts: {
    list: (params: { page?: number; limit?: number; search?: string; type?: string; orgType?: string; status?: string; minWarmth?: number }) => {
      const qs = new URLSearchParams();
      if (params.page) qs.set('page', String(params.page));
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.search) qs.set('search', params.search);
      if (params.type) qs.set('type', params.type);
      if (params.orgType) qs.set('orgType', params.orgType);
      if (params.status) qs.set('status', params.status);
      if (params.minWarmth) qs.set('minWarmth', String(params.minWarmth));
      return fetchApi(`/contacts?${qs.toString()}`);
    },
    get: (id: string) => fetchApi(`/contacts/${id}`),
    triggerResearch: (id: string) => fetchApi(`/contacts/${id}/research`, { method: 'POST' }),
    getGraph: (id: string) => fetchApi(`/contacts/${id}/graph`),
  },
  members: {
    list: () => fetchApi('/members'),
    get: (id: string) => fetchApi(`/members/${id}`),
    getContacts: (id: string) => fetchApi(`/members/${id}/contacts`),
  },
  interactions: {
    list: (params: { limit?: number; contactId?: string; memberId?: string }) => {
      const qs = new URLSearchParams();
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.contactId) qs.set('contactId', params.contactId);
      if (params.memberId) qs.set('memberId', params.memberId);
      return fetchApi(`/interactions?${qs.toString()}`);
    },
    create: (data: Record<string, unknown>) => fetchApi('/interactions', { method: 'POST', body: JSON.stringify(data) }),
  },
  graph: {
    full: () => fetchApi('/graph/full'),
    search: (query: string) => fetchApi(`/graph/search?q=${encodeURIComponent(query)}`),
    discover: (data: { query: string; maxResults?: number }) =>
      fetchApi('/graph/discover', { method: 'POST', body: JSON.stringify(data) }),
    gaps: () => fetchApi('/graph/gaps'),
    path: (from: string, to: string) => fetchApi(`/graph/path/${from}/${to}`),
    neighborhood: (id: string) => fetchApi(`/graph/neighborhood/${id}`),
  },
  admin: {
    stats: () => fetchApi('/admin/stats'),
    addMember: (email: string) => fetchApi('/admin/members', { method: 'POST', body: JSON.stringify({ email }) }),
    removeMember: (email: string) => fetchApi(`/admin/members/${encodeURIComponent(email)}`, { method: 'DELETE' }),
  },
  health: {
    ready: () => fetchApi('/health/ready'),
    queues: () => fetchApi('/health/queues'),
  },
  notion: {
    status: () => fetchApi('/notion/status'),
    sync: () => fetchApi('/notion/sync', { method: 'POST' }),
  },
};
