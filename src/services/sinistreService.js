// src/services/sinistreService.js

import { sinistreApi, authApi } from '../api/client';

export const sinistreService = {
  // Déclarations
  getMySinistres: () => sinistreApi.get('/sinistres/my/'),
  getSubmittedSinistres: () => sinistreApi.get('/sinistres/submitted/'),
  getValidationSinistres: () => sinistreApi.get('/sinistres/validation/'),
  getApprovedSinistres: () => sinistreApi.get('/sinistres/approved/'),
  getIndemnizedSinistres: () => sinistreApi.get('/sinistres/indemnized/'),
  getRejectedSinistres: () => sinistreApi.get('/sinistres/rejected/'),
  
  createPartial: (data) => sinistreApi.post('/sinistres/partial/', data),
  finalizeDeclaration: (data) => sinistreApi.post('/sinistres/finalize/', data),
  submitToValidator: (id) => sinistreApi.post(`/sinistres/${id}/submit/`),
  editDeclaration: (id, data) => sinistreApi.put(`/sinistres/${id}/edit/`, data),
  
  validateDeclaration: (data) => sinistreApi.post('/sinistres/validate/', data),
  reassignDeclaration: (data) => sinistreApi.post('/sinistres/reassign/', data),
  expertValidate: (id, data) => sinistreApi.post(`/sinistres/${id}/expert-validate/`, data),
  
  getDetail: (id) => sinistreApi.get(`/sinistres/${id}/`),
  getHistory: (id) => sinistreApi.get(`/sinistres/${id}/history/`),
  getMedia: (id) => sinistreApi.get(`/sinistres/${id}/medias/`),
  uploadMedia: (id, formData) => sinistreApi.post(`/sinistres/${id}/media/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  indemniser: (id, data) => sinistreApi.post(`/sinistres/${id}/indemniser/`, data),
  getCapitalizationStats: () => sinistreApi.get('/sinistres/capitalization/stats/'),
};

export const clientService = {
  // Clients
  getClients: () => authApi.get('/accounts/clients/'),
  getClientDetail: (id) => authApi.get(`/accounts/clients/${id}/`),
  createClient: (data) => authApi.post('/accounts/clients/create/', data),
  updateClient: (id, data) => authApi.put(`/accounts/clients/${id}/update/`, data),
  toggleClientStatus: (id) => authApi.post(`/accounts/clients/${id}/toggle-status/`),
  deleteClient: (id) => authApi.delete(`/accounts/clients/${id}/delete/`),
  
  // Assurances
  getAssurances: () => authApi.get('/accounts/assurances/'),
  createSouscription: (data) => authApi.post('/accounts/souscriptions/create/', data),
  addFamilyMember: (souscriptionId, data) => authApi.post(`/accounts/souscriptions/${souscriptionId}/members/add/`, data),
  getClientSouscriptions: (clientId) => authApi.get(`/accounts/souscriptions/client/${clientId}/`),
  getFamilyMembers: (souscriptionId) => authApi.get(`/accounts/family-members/souscription/${souscriptionId}/`),
  removeFamilyMember: (memberId) => authApi.delete(`/accounts/family-members/${memberId}/remove/`),
  checkExistingSouscription: (clientId, assuranceId) => authApi.get(`/accounts/souscriptions/check/${clientId}/${assuranceId}/`),
  
  // Recouvrements
  getClientDettes: (clientId) => sinistreApi.get(`/sinistres/recouvrements/clients/${clientId}/dettes/`),
  getClientRecouvrements: (clientId) => sinistreApi.get(`/sinistres/recouvrements/clients/${clientId}/recouvrements/`),
  createRecouvrement: (data) => sinistreApi.post('/sinistres/recouvrements/create/', data),
  updateRecouvrement: (id, data) => sinistreApi.put(`/sinistres/recouvrements/${id}/update/`, data),
  deleteRecouvrement: (id) => sinistreApi.delete(`/sinistres/recouvrements/${id}/delete/`),
  payRecouvrement: (id, data) => sinistreApi.post(`/sinistres/recouvrements/${id}/pay/`, data),
  exportRecouvrementStats: (clientId) => sinistreApi.get(`/sinistres/recouvrements/clients/${clientId}/recouvrement-stats/`),
  getRecouvrementDetail: (id) => sinistreApi.get(`/sinistres/recouvrements/${id}/detail/`),
};

export const userService = {
  getExperts: () => authApi.get('/accounts/experts/'),
  getDeclarants: () => authApi.get('/accounts/declarants/'),
  getUsers: () => authApi.get('/accounts/all-users/'),
  createUser: (data) => authApi.post('/accounts/users/create/', data),
  updateUser: (id, data) => authApi.put(`/accounts/users/${id}/edit/`, data),
  deleteUser: (id) => authApi.delete(`/accounts/users/${id}/delete/`),
  toggleUserStatus: (id) => authApi.post(`/accounts/users/${id}/toggle-status/`),
};

export default sinistreService;