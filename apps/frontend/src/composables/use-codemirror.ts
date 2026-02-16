import { shallowRef, onMounted, onUnmounted, watch, type Ref, type ShallowRef } from 'vue';
import { EditorState, StateEffect, StateField, type Extension } from '@codemirror/state';
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view';
import { go } from '@codemirror/lang-go';
import { oneDark } from '@codemirror/theme-one-dark';

interface LineRange {
  from: number;
  to: number;
}

const addHighlightsEffect = StateEffect.define<LineRange[]>();
const clearHighlightsEffect = StateEffect.define();

const highlightField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(clearHighlightsEffect)) {
        decorations = Decoration.none;
      }
      if (effect.is(addHighlightsEffect)) {
        const marks = effect.value.map((range) =>
          highlightMark.range(range.from, range.to),
        );
        decorations = Decoration.set(marks, true);
      }
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const highlightMark = Decoration.mark({
  class: 'cm-dfg-highlight',
});

const highlightTheme = EditorView.baseTheme({
  '.cm-dfg-highlight': {
    backgroundColor: 'rgba(66, 184, 131, 0.15)',
    borderBottom: '2px solid rgba(66, 184, 131, 0.5)',
  },
});

export const useCodemirror = (
  containerRef: Ref<HTMLElement | null>,
  options?: { extensions?: Extension[] },
) => {
  const view = shallowRef<EditorView | null>(null);

  onMounted(() => {
    if (!containerRef.value) return;

    const state = EditorState.create({
      doc: '',
      extensions: [
        go(),
        oneDark,
        EditorState.readOnly.of(true),
        EditorView.lineWrapping,
        highlightField,
        highlightTheme,
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-gutters': { backgroundColor: '#1a1a2e', borderRight: '1px solid rgba(255,255,255,0.1)' },
          '.cm-activeLineGutter': { backgroundColor: 'rgba(66,184,131,0.1)' },
        }),
        ...(options?.extensions ?? []),
      ],
    });

    view.value = new EditorView({
      state,
      parent: containerRef.value,
    });
  });

  onUnmounted(() => {
    view.value?.destroy();
    view.value = null;
  });

  const setContent = (code: string) => {
    if (!view.value) return;
    view.value.dispatch({
      changes: { from: 0, to: view.value.state.doc.length, insert: code },
    });
  };

  const highlightLines = (lines: number[]) => {
    if (!view.value) return;
    const doc = view.value.state.doc;
    const ranges: LineRange[] = [];

    for (const lineNum of lines) {
      if (lineNum > 0 && lineNum <= doc.lines) {
        const line = doc.line(lineNum);
        ranges.push({ from: line.from, to: line.to });
      }
    }

    view.value.dispatch({
      effects: [clearHighlightsEffect.of(null), addHighlightsEffect.of(ranges)],
    });
  };

  const clearHighlights = () => {
    if (!view.value) return;
    view.value.dispatch({ effects: clearHighlightsEffect.of(null) });
  };

  const scrollToLine = (lineNum: number) => {
    if (!view.value) return;
    const doc = view.value.state.doc;
    if (lineNum > 0 && lineNum <= doc.lines) {
      const line = doc.line(lineNum);
      view.value.dispatch({
        effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
      });
    }
  };

  return {
    view,
    setContent,
    highlightLines,
    clearHighlights,
    scrollToLine,
  };
};
