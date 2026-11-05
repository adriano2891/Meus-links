import React from "react";
import {
  Folder,
  FolderTree,
  FolderPlus,
  Tag,
  Bookmark,
  Code,
  Terminal,
  Layers,
  Database,
  Globe,
  Sparkles,
  FileText,
  BookOpen,
  Palette,
  Briefcase,
  Monitor,
  Cpu,
  Compass,
  Boxes,
  Workflow,
  Shield,
  Zap,
  Star,
  Heart,
  DollarSign,
  ShoppingBag,
  Music,
  Video,
  GraduationCap,
  Settings,
  Grid,
  Newspaper
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Folder: ({ className }) => <Folder className={className} />,
  FolderTree: ({ className }) => <FolderTree className={className} />,
  Bookmark: ({ className }) => <Bookmark className={className} />,
  Star: ({ className }) => <Star className={className} />,
  Zap: ({ className }) => <Zap className={className} />,
  Heart: ({ className }) => <Heart className={className} />,
  Sparkles: ({ className }) => <Sparkles className={className} />,
  Briefcase: ({ className }) => <Briefcase className={className} />,
  Code: ({ className }) => <Code className={className} />,
  Terminal: ({ className }) => <Terminal className={className} />,
  Monitor: ({ className }) => <Monitor className={className} />,
  Cpu: ({ className }) => <Cpu className={className} />,
  Globe: ({ className }) => <Globe className={className} />,
  Palette: ({ className }) => <Palette className={className} />,
  DollarSign: ({ className }) => <DollarSign className={className} />,
  ShoppingBag: ({ className }) => <ShoppingBag className={className} />,
  BookOpen: ({ className }) => <BookOpen className={className} />,
  GraduationCap: ({ className }) => <GraduationCap className={className} />,
  FileText: ({ className }) => <FileText className={className} />,
  Newspaper: ({ className }) => <Newspaper className={className} />,
  Layers: ({ className }) => <Layers className={className} />,
  Database: ({ className }) => <Database className={className} />,
  Shield: ({ className }) => <Shield className={className} />,
  Workflow: ({ className }) => <Workflow className={className} />,
  Boxes: ({ className }) => <Boxes className={className} />,
  Compass: ({ className }) => <Compass className={className} />,
  Music: ({ className }) => <Music className={className} />,
  Video: ({ className }) => <Video className={className} />,
  Tag: ({ className }) => <Tag className={className} />,
  FolderPlus: ({ className }) => <FolderPlus className={className} />,
  Grid: ({ className }) => <Grid className={className} />,
  Settings: ({ className }) => <Settings className={className} />
};

export const SUBCATEGORY_ICONS = CATEGORY_ICONS;

export const renderCategoryIcon = (iconName?: string, className: string = "w-4 h-4") => {
  if (!iconName) return <Folder className={className} />;
  const Comp = CATEGORY_ICONS[iconName];
  if (Comp) return <Comp className={className} />;
  return <Folder className={className} />;
};
