from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password
from rest_framework.test import APIClient
from rest_framework import status
from app_core.models.registration import RegistrationRequest
from app_core.models.notification import Notification

class RegistrationFlowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Criar admin
        self.admin_user = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='Password123'
        )
        
        # Criar usuário comum
        self.regular_user = User.objects.create_user(
            username='regular_test',
            email='regular@test.com',
            password='Password123'
        )
        
        # Payload válido para nova solicitação
        self.valid_payload = {
            'username': 'new_visitor',
            'email': 'new_visitor@test.com',
            'first_name': 'New',
            'last_name': 'Visitor',
            'password': 'StrongPassword123'
        }

    def test_create_registration_request_success(self):
        # 1. Qualquer visitante pode criar pedido de cadastro
        response = self.client.post('/api/registration-requests/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RegistrationRequest.objects.count(), 1)
        
        req = RegistrationRequest.objects.first()
        self.assertEqual(req.username, 'new_visitor')
        self.assertEqual(req.status, 'PENDING')
        # Verificar se a senha foi guardada com hash
        self.assertTrue(check_password('StrongPassword123', req.password))
        
        # 2. Verificar se a notificação foi enviada ao administrador
        self.assertEqual(Notification.objects.count(), 1)
        notification = Notification.objects.first()
        self.assertEqual(notification.user, self.admin_user)
        self.assertEqual(notification.registration_request, req)
        self.assertFalse(notification.is_read)

    def test_create_registration_request_validation_rules(self):
        # Testar senha fraca (sem número, sem maiúscula, ou muito curta)
        invalid_payload = self.valid_payload.copy()
        invalid_payload['password'] = 'weak'
        response = self.client.post('/api/registration-requests/', invalid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
        
        # Testar username existente
        invalid_payload = self.valid_payload.copy()
        invalid_payload['username'] = 'regular_test'
        response = self.client.post('/api/registration-requests/', invalid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

        # Testar email existente
        invalid_payload = self.valid_payload.copy()
        invalid_payload['email'] = 'regular@test.com'
        response = self.client.post('/api/registration-requests/', invalid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_admin_approve_registration_request(self):
        # Criar a solicitação primeiro
        create_response = self.client.post('/api/registration-requests/', self.valid_payload, format='json')
        req_id = create_response.data['id']
        
        # Tentar aprovar sem estar logado
        response = self.client.post(f'/api/registration-requests/{req_id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Tentar aprovar com usuário não-admin
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(f'/api/registration-requests/{req_id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Aprovar como admin
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/registration-requests/{req_id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar se o usuário foi criado no banco
        self.assertTrue(User.objects.filter(username='new_visitor').exists())
        new_user = User.objects.get(username='new_visitor')
        self.assertTrue(new_user.is_active)
        
        # Verificar status do pedido
        req = RegistrationRequest.objects.get(id=req_id)
        self.assertEqual(req.status, 'APPROVED')
        
        # Verificar se as notificações associadas foram marcadas como lidas
        self.assertTrue(Notification.objects.filter(registration_request=req).first().is_read)

    def test_admin_reject_registration_request(self):
        create_response = self.client.post('/api/registration-requests/', self.valid_payload, format='json')
        req_id = create_response.data['id']
        
        # Rejeitar como admin
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/registration-requests/{req_id}/reject/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar se o usuário NÃO foi criado
        self.assertFalse(User.objects.filter(username='new_visitor').exists())
        
        # Verificar status do pedido
        req = RegistrationRequest.objects.get(id=req_id)
        self.assertEqual(req.status, 'REJECTED')
        
        # Verificar se as notificações associadas foram marcadas como lidas
        self.assertTrue(Notification.objects.filter(registration_request=req).first().is_read)
