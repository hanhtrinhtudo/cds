import { supabase } from "../supabaseClient";
import { News } from "../../types";

export const newsRepository = {
  async getNews(): Promise<News[]> {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error in newsRepository.getNews:", error);
      throw new Error(`Failed to fetch news: ${error.message}`);
    }

    return (data || []).map(mapDbNews);
  },

  async getNewsById(id: string): Promise<News | null> {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error in newsRepository.getNewsById:", error);
      throw new Error(`Failed to fetch news item: ${error.message}`);
    }

    return data ? mapDbNews(data) : null;
  },

  async addNews(newsItem: News): Promise<News> {
    const dbNews = mapNewsToDb(newsItem);
    const { data, error } = await supabase
      .from("news")
      .insert([dbNews])
      .select()
      .single();

    if (error) {
      console.error("Error in newsRepository.addNews:", error);
      throw new Error(`Failed to insert news item: ${error.message}`);
    }

    return mapDbNews(data);
  },

  async updateNews(id: string, updates: Partial<News>): Promise<News> {
    const dbUpdates = mapPartialNewsToDb(updates);
    const { data, error } = await supabase
      .from("news")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error in newsRepository.updateNews:", error);
      throw new Error(`Failed to update news item: ${error.message}`);
    }

    return mapDbNews(data);
  },

  async deleteNews(id: string): Promise<void> {
    const { error } = await supabase
      .from("news")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error in newsRepository.deleteNews:", error);
      throw new Error(`Failed to delete news item: ${error.message}`);
    }
  }
};

function mapDbNews(row: any): News {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    summary: row.summary || "",
    content: row.content,
    imageUrl: row.image_url || undefined,
    visibility: row.visibility as any,
    status: row.status as any,
    authorId: row.author_id || "",
    publishedAt: row.published_at || "",
    createdAt: row.created_at
  };
}

function mapNewsToDb(news: News): any {
  return {
    id: news.id,
    title: news.title,
    category: news.category,
    summary: news.summary,
    content: news.content,
    image_url: news.imageUrl || null,
    visibility: news.visibility,
    status: news.status,
    author_id: news.authorId || null,
    published_at: news.publishedAt || null,
    created_at: news.createdAt
  };
}

function mapPartialNewsToDb(updates: Partial<News>): any {
  const db: any = {};
  if (updates.title !== undefined) db.title = updates.title;
  if (updates.category !== undefined) db.category = updates.category;
  if (updates.summary !== undefined) db.summary = updates.summary;
  if (updates.content !== undefined) db.content = updates.content;
  if (updates.imageUrl !== undefined) db.image_url = updates.imageUrl || null;
  if (updates.visibility !== undefined) db.visibility = updates.visibility;
  if (updates.status !== undefined) db.status = updates.status;
  if (updates.publishedAt !== undefined) db.published_at = updates.publishedAt || null;
  return db;
}
