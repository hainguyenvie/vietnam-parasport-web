"use client";

import { apiClient } from "@/lib/api-client";
import { getApiUrl } from "@/utils/api";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Video } from './TiptapVideo';
import { 
  Bold, Italic, Strikethrough, List, ListOrdered, 
  Quote, Undo, Redo, ImageIcon, Video as VideoIcon, Link as LinkIcon, Unlink, Loader2,
  Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify, Minus
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface TiptapEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ value, onChange, placeholder }: TiptapEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit includes Link in the installed Tiptap version; disable
        // that default so the configured Link extension below is the only one.
        link: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Video,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] px-4 py-3 text-slate-800 dark:text-slate-200',
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      // Prevent cursor jumping when typing
      const isSame = editor.getHTML() === value;
      if (!isSame) {
        editor.commands.setContent(value, false as any);
      }
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="min-h-[200px] border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 animate-pulse"></div>;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    if (type === 'image' && file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 10MB");
      return;
    }
    if (type === 'video' && file.size > 50 * 1024 * 1024) {
      toast.error("Kích thước video không được vượt quá 50MB. Vui lòng sử dụng link YouTube/Vimeo nếu file lớn hơn.");
      return;
    }

    const isImageUpload = type === 'image';
    if (isImageUpload) setIsUploadingImage(true);
    else setIsUploadingVideo(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiClient.request("/media/upload?isPublic=true", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (type === 'image') {
          editor.chain().focus().setImage({ src: data.url }).run();
        } else {
          editor.chain().focus().setVideo({ src: data.url }).run();
        }
      } else {
        const err = await res.json();
        toast.error(err.message || err.error || "Tải lên thất bại");
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Lỗi kết nối khi tải lên");
    } finally {
      if (isImageUpload) setIsUploadingImage(false);
      else setIsUploadingVideo(false);
      
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleInsertVideoUrl = () => {
    const url = window.prompt('Nhập đường dẫn Video (YouTube, Vimeo, mp4, etc.)');
    if (url) {
      editor.chain().focus().setVideo({ src: url }).run();
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="Tiêu đề 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="Tiêu đề 3"
        >
          <Heading3 size={16} />
        </button>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="In đậm"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="In nghiêng"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="Gạch ngang"
        >
          <Strikethrough size={16} />
        </button>
        
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="Căn trái"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="Căn giữa"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="Căn phải"
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="Căn đều"
        >
          <AlignJustify size={16} />
        </button>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="Danh sách dấu chấm"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="Danh sách số"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="Trích dẫn"
        >
          <Quote size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg transition text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
          title="Đường kẻ ngang"
        >
          <Minus size={16} />
        </button>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded-lg transition ${editor.isActive('link') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="Thêm liên kết"
        >
          <LinkIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          className="p-1.5 rounded-lg transition text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-30"
          title="Hủy liên kết"
        >
          <Unlink size={16} />
        </button>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        {/* Upload Image */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploadingImage}
          className="p-1.5 rounded-lg transition text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50"
          title="Chèn ảnh (Max 10MB)"
        >
          {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
        </button>
        <input 
          type="file" 
          ref={imageInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'image');
          }} 
        />

        {/* Upload Video */}
        <div className="relative group inline-block">
          <button
            type="button"
            disabled={isUploadingVideo}
            onClick={() => videoInputRef.current?.click()}
            className="p-1.5 rounded-lg transition text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50"
            title="Chèn Video (Max 50MB)"
          >
            {isUploadingVideo ? <Loader2 size={16} className="animate-spin" /> : <VideoIcon size={16} />}
          </button>
          
          <input 
            type="file" 
            ref={videoInputRef} 
            accept="video/*" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'video');
            }} 
          />
        </div>
        
        {/* URL Video */}
        <button
            type="button"
            onClick={handleInsertVideoUrl}
            className="p-1.5 rounded-lg transition text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
            title="Nhúng Video bằng URL (Youtube/Vimeo/mp4...)"
          >
            <span className="text-xs font-bold leading-none">URL Vid</span>
        </button>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1 ml-auto"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg transition text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-30"
          title="Hoàn tác"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg transition text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-30"
          title="Làm lại"
        >
          <Redo size={16} />
        </button>
      </div>

      <EditorContent editor={editor} className="bg-white dark:bg-slate-800" />
      
      {/* Tailwind Typography plugin logic requires 'prose' class to format elements nicely inside */}
    </div>
  );
}
