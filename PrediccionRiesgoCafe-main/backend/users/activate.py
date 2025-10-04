from django.views import View
from django.shortcuts import redirect
from .models import CustomUser

class ActivateAccountView(View):
    def get(self, request, token):
        try:
            user = CustomUser.objects.get(verification_token=token)
            user.email_verified = True
            user.is_active = True
            user.verification_token = None
            user.save()
            return redirect('http://localhost:3000/activate')
        except CustomUser.DoesNotExist:
            return redirect('http://localhost:3000/activate?error=1')
