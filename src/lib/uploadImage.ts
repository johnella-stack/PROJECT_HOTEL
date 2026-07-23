import { storage } from "../firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export async function uploadRoomImage(file: File) {
  const imageRef = ref(
    storage,
    `rooms/${Date.now()}-${file.name}`
  );

  await uploadBytes(imageRef, file);

  return await getDownloadURL(imageRef);
}