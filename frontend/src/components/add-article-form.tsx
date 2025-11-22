import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
		<div className="flex flex-col space-y-4 max-h-[60vh] overflow-y-auto">
			<Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
			<Input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
			<Textarea
				placeholder="Content"
				value={content}
				onChange={(e) => setContent(e.target.value)}
				className="min-h-[150px] resize-y"
			/>
			<div className="flex justify-end space-x-2">
				<Button
					variant="secondary"
					onClick={() => {
						setTitle("");
						setUrl("");
						setContent("");
					}}
				>
					Cancel
				</Button>
				<Button onClick={handleSave}>Save Article</Button>
			</div>
		</div>
	);
};

export default AddArticleForm;
