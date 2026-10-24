import type { MediaResult } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Review } from '@/types';
import imageBlobReduce from 'image-blob-reduce';

const reducer = imageBlobReduce();


function convertBlobToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  };

export async function savePicture (photo: MediaResult, fileName: string) {
    // Fetch the photo, read as a blob, then convert to base64 format
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    const blob2 = await reducer.toBlob(blob, {max: 300})
    const base64Data = (await convertBlobToBase64(blob2)) as string;

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    // Use webPath to display the new image instead of base64 since it's
    // already loaded into memory
    return {
      filepath: fileName,
      webviewPath: photo.webPath,
    };
  };


export async function loadPicture (review: Review) {
  if (review.imgFilepath) {

    const readFile = await Filesystem.readFile({
      path: review.imgFilepath,
      directory: Directory.Data,
    }).catch((e) => {
    });
    return  `data:image/jpeg;base64,${readFile?.data}`;
  } else {
    return review.imgWebviewPath
  }
}

export async function removePhotos() {
    return await Filesystem.rmdir({
        path: Directory.Data,
        recursive: true,
    })
}

export async function removePhoto(filepath: string) {
    return await Filesystem.deleteFile({
        path: filepath,
        directory: Directory.Data,
    });
}

// export const usePhotoGallery = () => {
//   const photos = ref<UserPhoto[]>([]);

//   const PHOTO_STORAGE = 'photos';

//   const addNewToGallery = async () => {
//     // Take a photo
//     const capturedPhoto = await Camera.takePhoto({
//       quality: 100,
//     });

//     const fileName = Date.now() + '.jpeg';
//     const savedImageFile = await savePicture(capturedPhoto, fileName);

//     photos.value = [savedImageFile, ...photos.value];
//   };



  

//   const cachePhotos = () => {
//     Preferences.set({
//       key: PHOTO_STORAGE,
//       value: JSON.stringify(photos.value),
//     });
//   };

//   const loadSaved = async () => {
//     const photoList = await Preferences.get({ key: PHOTO_STORAGE });
//     const photosInPreferences = photoList.value ? JSON.parse(photoList.value) : [];

//     

//     photos.value = photosInPreferences;
//   };

//   watch(photos, cachePhotos);

//   return {
//     addNewToGallery,
//     photos,
//   };
// };

// export interface UserPhoto {
//   filepath: string;
//   webviewPath?: string;
// }