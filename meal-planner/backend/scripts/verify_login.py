from app.db import SessionLocal
from app.models import User
from app.auth_utils import verify_password, get_password_hash

def test_login():
    print("--- DIAGNOSTIC LOGIN ---")
    db = SessionLocal()
    try:
        username = "admin"
        password = "admin" # Le mot de passe qu'on teste
        
        print(f"1. Recherche de l'utilisateur '{username}'...")
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            print("❌ ERREUR: Utilisateur non trouvé dans la base de données !")
            return

        print(f"✅ Utilisateur trouvé. ID: {user.id}")
        print(f"   Hash stored: {user.hashed_password[:20]}...")

        print("2. Test de vérification du mot de passe...")
        try:
            is_valid = verify_password(password, user.hashed_password)
            if is_valid:
                print("✅ SUCCÈS : Le mot de passe est VALIDE.")
            else:
                print("❌ ÉCHEC : Le mot de passe est INVALIDE (Le hash ne correspond pas).")
                print("   Tentative de régénération du hash pour comparer...")
                new_hash = get_password_hash(password)
                print(f"   Nouveau hash généré : {new_hash[:20]}...")
        except Exception as e:
            print(f"❌ ERREUR CRITIQUE lors de la vérification : {e}")
            import traceback
            traceback.print_exc()

    except Exception as e:
        print(f"❌ Erreur DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_login()
