/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { INITIAL_NEWS_PORTAL } from "./data";
import { Article } from "./types";
import NewsPortal from "./components/NewsPortal";
import EditorialLab from "./components/EditorialLab";
import CmsAdmin from "./components/CmsAdmin";

export default function App() {
  // Store articles in local state to allow dynamic updates and mock publishes
  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem("unugiri_terkini_articles");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to load saved state from localStorage:", err);
      }
    }
    return INITIAL_NEWS_PORTAL;
  });

  // Current headline displayed on main portal home
  const [currentHeadlineId, setCurrentHeadlineId] = useState<string>(() => {
    const saved = localStorage.getItem("unugiri_terkini_headline_id");
    return saved || INITIAL_NEWS_PORTAL[0].id;
  });

  // Flow State: "portal" for public portal news list | "lab" for editorial kitchen sandbox | "cms" for admin panel
  const [view, setView] = useState<"portal" | "lab" | "cms">("portal");

  // Persist states in standard Client local storage
  useEffect(() => {
    localStorage.setItem("unugiri_terkini_articles", JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem("unugiri_terkini_headline_id", currentHeadlineId);
  }, [currentHeadlineId]);

  // Handler to coordinate headline selection changes
  const handleSetHeadlineId = (id: string) => {
    setCurrentHeadlineId(id);
  };

  // Navigates to Editorial Dapur Redaksi focusing on raw parameters of an article scenario
  const handleNavigateToLab = (initialArticleId?: string) => {
    if (initialArticleId) {
      setCurrentHeadlineId(initialArticleId);
    }
    setView("lab");
  };

  // Reset to static seed articles
  const handleResetToDefault = () => {
    if (window.confirm("Apakah Anda yakin ingin menyetel ulang data silsilah artikel ke bawaan murni silsilah semula? Seluruh adat tulisan baru Anda akan terhapus.")) {
      setArticles(INITIAL_NEWS_PORTAL);
      setCurrentHeadlineId(INITIAL_NEWS_PORTAL[0].id);
      localStorage.removeItem("unugiri_terkini_articles");
      localStorage.removeItem("unugiri_terkini_headline_id");
    }
  };

  // Callback to accept optimized and visually tweaked copies, save them, and hot-reload portal homepage
  const handlePublishNews = (updatedArticle: Article) => {
    setArticles((prev) =>
      prev.map((art) => (art.id === updatedArticle.id ? updatedArticle : art))
    );
    setCurrentHeadlineId(updatedArticle.id);
    setView("portal");
  };

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {view === "portal" ? (
        <NewsPortal
          articles={articles}
          currentHeadlineId={currentHeadlineId}
          onSetHeadlineId={handleSetHeadlineId}
          onNavigateToLab={handleNavigateToLab}
          onNavigateToCms={() => setView("cms")}
        />
      ) : view === "lab" ? (
        <EditorialLab
          currentArticleId={currentHeadlineId}
          articles={articles}
          onPublishNews={handlePublishNews}
          onNavigateBack={() => setView("portal")}
        />
      ) : (
        <CmsAdmin
          articles={articles}
          onAddArticle={(newList) => {
            setArticles(newList);
            // safe recovery if current headline is deleted
            if (newList.length > 0 && !newList.some((a) => a.id === currentHeadlineId)) {
              setCurrentHeadlineId(newList[0].id);
            }
          }}
          onResetToDefault={handleResetToDefault}
          onNavigateToTab={(tab) => setView(tab)}
        />
      )}
    </div>
  );
}
