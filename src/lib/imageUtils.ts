
export const CATEGORY_IMAGES: Record<string, string> = {
  "Web Development": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
  "AI": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
  "Artificial Intelligence": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
  "Cybersecurity": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
  "Databases": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=800",
  "Data Structures": "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800",
  "Algorithms": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&q=80&w=800",
  "Operating Systems": "https://images.unsplash.com/photo-1629654274833-468f1bc44773?auto=format&fit=crop&q=80&w=800",
  "Networks": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800",
  "Computer Science": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
};

export const DEFAULT_NOTE_IMAGE = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800";

export const getNoteCoverImage = (categoryName?: string) => {
  if (!categoryName) return DEFAULT_NOTE_IMAGE;
  
  // Try exact match
  if (CATEGORY_IMAGES[categoryName]) return CATEGORY_IMAGES[categoryName];
  
  // Try partial match
  const found = Object.entries(CATEGORY_IMAGES).find(([key]) => 
    categoryName.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(categoryName.toLowerCase())
  );
  
  return found ? found[1] : DEFAULT_NOTE_IMAGE;
};
