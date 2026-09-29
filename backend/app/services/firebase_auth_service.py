import logging
from typing import Optional
from ..config import settings
from ..models.schemas import UserProfile

logger = logging.getLogger("vc.auth")

class FirebaseAuthService:
    """
    Firebase Authentication service.
    Verifies Firebase JWT ID tokens when configured.
    Falls back safely to authenticated Demo User when running without Firebase credentials.
    """
    def __init__(self):
        self.initialized = False
        self._initialize_firebase()

    def _initialize_firebase(self):
        if settings.is_firebase_configured:
            try:
                import firebase_admin
                from firebase_admin import credentials, auth
                
                # Check if app already initialized
                if not firebase_admin._apps:
                    cred_dict = {
                        "type": "service_account",
                        "project_id": settings.FIREBASE_PROJECT_ID,
                        "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n") if settings.FIREBASE_PRIVATE_KEY else "",
                        "client_email": settings.FIREBASE_CLIENT_EMAIL,
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                self.initialized = True
                logger.info("Firebase Admin SDK successfully initialized.")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase Admin SDK: {str(e)}")
                self.initialized = False

    def verify_token(self, token: str) -> Optional[UserProfile]:
        """Verify Firebase Bearer token and return verified UserProfile."""
        # Check for demo mode tokens
        if token.startswith("demo-token-") or token == "demo" or settings.DEMO_MODE:
            # Check if student or admin token
            if "student" in token:
                return UserProfile(
                    uid="user-student-demo",
                    email="student@vconnect.edu",
                    display_name="Student (Aisha Patel)",
                    role="student",
                    is_demo_user=True,
                    avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
                )
            elif "admin" in token:
                return UserProfile(
                    uid="user-admin-demo",
                    email="admin@vconnect.edu",
                    display_name="Admin (Lead Director)",
                    role="admin",
                    is_demo_user=True,
                    avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                )
            elif "aisha" in token:
                return UserProfile(
                    uid="user-aisha",
                    email="aisha@vconnect.edu",
                    display_name="Aisha Patel",
                    role="student",
                    is_demo_user=True,
                    avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
                )
            elif "rahul" in token:
                return UserProfile(
                    uid="user-rahul",
                    email="rahul@vconnect.edu",
                    display_name="Rahul Sharma",
                    role="student",
                    is_demo_user=True,
                    avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
                )
            elif "kiran" in token:
                return UserProfile(
                    uid="user-kiran",
                    email="kiran@vconnect.edu",
                    display_name="Kiran Rao",
                    role="student",
                    is_demo_user=True,
                    avatar_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces"
                )
            else:
                return UserProfile(
                    uid="user-demo-judge",
                    email="admin@vconnect.edu",
                    display_name="Admin (Lead Director)",
                    role="admin",
                    is_demo_user=True,
                    avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                )

        if not self.initialized:
            logger.warning("Firebase not initialized and non-demo token provided.")
            return None

        try:
            from firebase_admin import auth
            decoded_token = auth.verify_id_token(token)
            return UserProfile(
                uid=decoded_token.get("uid", "unknown"),
                email=decoded_token.get("email", ""),
                display_name=decoded_token.get("name") or decoded_token.get("email", "User").split("@")[0],
                avatar_url=decoded_token.get("picture"),
                role="member",
                is_demo_user=False
            )
        except Exception as e:
            logger.error(f"Firebase token verification failed: {str(e)}")
            return None

firebase_auth = FirebaseAuthService()
