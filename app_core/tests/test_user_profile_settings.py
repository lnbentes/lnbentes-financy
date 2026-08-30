from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status


class UserProfileSettingsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='user_settings',
            password='OldPassword123',
            first_name='NomeOriginal',
            last_name='SobrenomeOriginal',
            email='original@exemplo.com'
        )
        self.other_user = User.objects.create_user(
            username='other_user',
            password='Password123',
            first_name='Outro',
            last_name='Usuario',
            email='outro@exemplo.com'
        )
        self.client = APIClient()

    def test_user_can_update_own_name_and_email(self):
        """Valida se o usuário autenticado consegue alterar seu primeiro nome, sobrenome e e-mail via PATCH /api/users/{id}/"""
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            f'/api/users/{self.user.id}/',
            {
                'first_name': 'Carlos',
                'last_name': 'Eduardo',
                'email': 'carlos.eduardo@novomail.com'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Carlos')
        self.assertEqual(response.data['last_name'], 'Eduardo')
        self.assertEqual(response.data['email'], 'carlos.eduardo@novomail.com')

        # Verifica persistência no banco de dados
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Carlos')
        self.assertEqual(self.user.last_name, 'Eduardo')
        self.assertEqual(self.user.email, 'carlos.eduardo@novomail.com')

    def test_user_can_change_own_password_and_authenticate(self):
        """Valida se o usuário autenticado consegue alterar sua própria senha e autenticar com a nova senha"""
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            f'/api/users/{self.user.id}/reset-password/',
            {'password': 'NewPassword999!'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Testa autenticação com a nova senha
        login_success = self.client.login(username='user_settings', password='NewPassword999!')
        self.assertTrue(login_success)

    def test_user_cannot_elevate_privileges(self):
        """Valida que um usuário comum não consegue se auto-promover para staff ou superusuário"""
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            f'/api/users/{self.user.id}/',
            {
                'is_staff': True,
                'is_superuser': True,
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)

    def test_user_cannot_modify_other_user_profile(self):
        """Valida que um usuário comum não consegue alterar o perfil de outro usuário"""
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            f'/api/users/{self.other_user.id}/',
            {'first_name': 'HackerName'},
            format='json'
        )

        # Deve retornar 404 (já que o get_queryset filtra apenas o próprio usuário para não-staff)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.other_user.refresh_from_db()
        self.assertEqual(self.other_user.first_name, 'Outro')

    def test_user_cannot_reset_other_user_password(self):
        """Valida que um usuário comum não consegue redefinir a senha de outro usuário"""
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            f'/api/users/{self.other_user.id}/reset-password/',
            {'password': 'HackedPassword123'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
