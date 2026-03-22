"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Slide } from "@/types/presenton";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface EditorState {
  presentationId: string;
  slides: Slide[];
  selectedIndex: number;
  undoStack: Slide[][];
  redoStack: Slide[][];
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type Action =
  | { type: "SET_SLIDES"; slides: Slide[] }
  | { type: "SELECT"; index: number }
  | { type: "UPDATE_SLIDE"; index: number; slide: Slide }
  | { type: "ADD_SLIDE"; slide: Slide; at?: number }
  | { type: "DELETE_SLIDE"; index: number }
  | { type: "REORDER"; from: number; to: number }
  | { type: "UNDO" }
  | { type: "REDO" };

function pushUndo(state: EditorState): EditorState {
  return {
    ...state,
    undoStack: [...state.undoStack, state.slides],
    redoStack: [],
  };
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "SET_SLIDES":
      return { ...state, slides: action.slides, undoStack: [], redoStack: [], selectedIndex: 0 };

    case "SELECT":
      return { ...state, selectedIndex: action.index };

    case "UPDATE_SLIDE": {
      const s = pushUndo(state);
      const slides = [...s.slides];
      slides[action.index] = action.slide;
      return { ...s, slides };
    }

    case "ADD_SLIDE": {
      const s = pushUndo(state);
      const slides = [...s.slides];
      const at = action.at ?? slides.length;
      slides.splice(at, 0, action.slide);
      return { ...s, slides, selectedIndex: at };
    }

    case "DELETE_SLIDE": {
      if (state.slides.length <= 1) return state;
      const s = pushUndo(state);
      const slides = s.slides.filter((_, i) => i !== action.index);
      const selectedIndex = Math.min(s.selectedIndex, slides.length - 1);
      return { ...s, slides, selectedIndex };
    }

    case "REORDER": {
      const s = pushUndo(state);
      const slides = [...s.slides];
      const [moved] = slides.splice(action.from, 1);
      slides.splice(action.to, 0, moved);
      return { ...s, slides, selectedIndex: action.to };
    }

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const undoStack = [...state.undoStack];
      const prev = undoStack.pop()!;
      return {
        ...state,
        slides: prev,
        undoStack,
        redoStack: [...state.redoStack, state.slides],
        selectedIndex: Math.min(state.selectedIndex, prev.length - 1),
      };
    }

    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const redoStack = [...state.redoStack];
      const next = redoStack.pop()!;
      return {
        ...state,
        slides: next,
        redoStack,
        undoStack: [...state.undoStack, state.slides],
        selectedIndex: Math.min(state.selectedIndex, next.length - 1),
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<Action>;
  selectedSlide: Slide | null;
  canUndo: boolean;
  canRedo: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function PresentationEditorProvider({
  presentationId,
  initialSlides,
  children,
}: {
  presentationId: string;
  initialSlides: Slide[];
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    presentationId,
    slides: initialSlides,
    selectedIndex: 0,
    undoStack: [],
    redoStack: [],
  });

  const selectedSlide = state.slides[state.selectedIndex] ?? null;
  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  const value = useMemo(
    () => ({ state, dispatch, selectedSlide, canUndo, canRedo }),
    [state, selectedSlide, canUndo, canRedo],
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within PresentationEditorProvider");
  return ctx;
}
