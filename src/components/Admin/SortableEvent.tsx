import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, Trash2, GripVertical } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  booking_type: 'class' | 'event' | 'reservation' | null;
  active: boolean;
}

interface SortableEventProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
}

export function SortableEvent({ event, onEdit, onDelete }: SortableEventProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: event.id });

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
      className={`${!event.active ? 'bg-gray-50' : ''} ${isDragging ? 'shadow-lg' : ''}`}
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
          <span className="ml-2">{event.title}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{event.date}</div>
        <div className="text-sm text-gray-500">{event.time}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="capitalize">{event.booking_type || 'None'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {event.active ? (
          <span className="text-green-600">Active</span>
        ) : (
          <span className="text-gray-500">Inactive</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button
          onClick={() => onEdit(event)}
          className="text-ocean-600 hover:text-ocean-700 mr-4"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(event.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}