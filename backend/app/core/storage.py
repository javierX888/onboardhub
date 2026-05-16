from supabase import create_client, Client
from app.core.config import settings
import os

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

class StorageService:
    @staticmethod
    async def upload_file(file_content: bytes, file_name: str, content_type: str) -> str:
        """
        Uploads a file to Supabase Storage and returns the public URL.
        Bucket name: onboarding-documents
        """
        bucket_name = "onboarding-documents"
        
        # Upload the file
        # Note: supabase-py is sync, but we wrap it in our logic
        response = supabase.storage.from_(bucket_name).upload(
            path=file_name,
            file=file_content,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
        return public_url

storage_service = StorageService()
