import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, Trash2, GripVertical } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  menu_type: string;
  display_order: number;
  active: boolean;
}

interface SortableCategoryProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export function SortableCategory({ category, onEdit, onDelete }: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`${!category.active ? 'bg-gray-50' : ''} ${isDragging ? 'shadow-lg' : ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap w-[120px]">
        <div className="flex items-center">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing hover:text-ocean-600 focus:outline-none"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
          <span className="ml-2">{category.display_order}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
        {category.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="capitalize">{category.menu_type}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {category.active ? (
          <span className="text-green-600">Active</span>
        ) : (
          <span className="text-gray-500">Inactive</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button
          onClick={() => onEdit(category)}
          className="text-ocean-600 hover:text-ocean-700 mr-4"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(category.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}