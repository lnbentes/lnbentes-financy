from django.shortcuts import render
from django.contrib.auth.decorators import login_required, user_passes_test


def admin_portal_view(request):
    """
    Renderiza a interface do portal administrativo.
    """
    return render(request, 'portal_admin.html', {
        'title': 'Portal Administrativo - LnB Financy'
    })
