import React, { useState } from "react";

interface AddArticleFormProps {
  onSave: (title: string, url: string, content: string) => void;
}

const AddArticleForm: React.FC<AddArticleFormProps> = ({ onSave }) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (!title || !url || !content) return;
    onSave(title, url, content);
    setTitle("");
    setUrl("");
    setContent("");
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Add a New Article</h2>
      <div className="flex flex-col space-y-2">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <input
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button onClick={handleSave} className="btn-primary">
          Save Article
        </button>
      </div>
    </section>
  );
};

export default AddArticleForm;