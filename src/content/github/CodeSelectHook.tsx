import { nullableMax, nullableMin, parseHash } from "@r2c/extension/utils";
import * as React from "react";

type CodeSelectTrigger = "navigation" | "hashchange" | "selectionchanged";

interface CodeSelectHookProps {
  onSelectionChange?(
    newState: CodeSelectHookState,
    trigger: CodeSelectTrigger
  ): void;
  children(state: CodeSelectHookState): React.ReactNode;
}

interface CodeSelectHookState {
  isSelecting: boolean;
  lineStart: number | null;
  lineStartColumn: number | null;
  lineEnd: number | null;
  lineEndColumn: number | null;
  selection: string | null;
  filePath: string;
  commit: string | null;
  trigger: CodeSelectTrigger | undefined;
}

export default class CodeSelectHook extends React.Component<
  CodeSelectHookProps,
  CodeSelectHookState
> {
  public state: CodeSelectHookState = {
    isSelecting: false,
    lineStart: null,
    lineStartColumn: null,
    lineEnd: null,
    lineEndColumn: null,
    selection: null,
    filePath: "",
    commit: null,
    trigger: undefined
  };

  public componentDidMount() {
    // FIXME Gross hack to wait until elements are finished loading before retrieving dom
    setTimeout(() => {
      this.addTextSelectHandler();
      this.addHashChangeHandler();
      this.updateSelectionFromHash(window.location.hash);
    }, 1000);
  }

  public componentDidUpdate(
    prevProps: CodeSelectHookProps,
    prevState: CodeSelectHookState
  ) {
    if (
      (prevState.isSelecting !== this.state.isSelecting ||
        prevState.lineStart !== this.state.lineStart ||
        prevState.lineEnd !== this.state.lineEnd) &&
      this.state.trigger != null &&
      this.props.onSelectionChange != null
    ) {
      this.props.onSelectionChange(this.state, this.state.trigger);
    }
  }

  public render() {
    if (this.props.children != null) {
      return this.props.children(this.state);
    }

    return null;
  }

  private addTextSelectHandler = () => {
    document.addEventListener("mouseup", this.handleSelectionChange);
  };

  private addHashChangeHandler = () => {
    window.addEventListener("hashchange", this.handleHashChange);
  };

  private handleHashChange = () => {
    this.updateSelectionFromHash(window.location.hash);
  };

  private updateSelection(lineStart: number, lineEnd?: number) {
    this.setState({
      lineStart: nullableMin(lineStart, lineEnd),
      lineEnd: nullableMax(lineStart, lineEnd),
      isSelecting: true
    });
  }

  private deselect() {
    if (this.state.isSelecting) {
      this.setState({
        isSelecting: false
      });
    }
  }

  private updateSelectionFromHash = (hash: string): void => {
    const parsed = parseHash(hash);

    if (parsed == null) {
      this.deselect();
    } else if (parsed.length === 1) {
      const [lineStart] = parsed;
      this.updateSelection(lineStart);
    } else {
      const [lineStart, lineEnd] = parsed;
      this.updateSelection(lineStart, lineEnd);
    }
  };

  private handleSelectionChange = (e: Event) => {
    const selection = window.getSelection();
    const lineStart = this.findLineNumberFromSelectionNode(
      selection.anchorNode
    );
    const lineEnd = this.findLineNumberFromSelectionNode(selection.focusNode);

    if (lineStart != null && lineEnd != null) {
      this.updateSelection(lineStart, lineEnd);
    } else {
      this.deselect();
    }
  };

  private findLineNumberFromSelectionNode = (node: Node): number | null => {
    if (node == null) {
      return null;
    }

    const element =
      node.nodeType === Node.ELEMENT_NODE && (node as Element).id
        ? (node as Element)
        : node.parentElement;

    if (element == null) {
      return null;
    }

    const closestLineMatch = element.closest("td.blob-code");

    if (closestLineMatch != null) {
      return parseInt(closestLineMatch.id.slice(2), 10);
    } else {
      return null;
    }
  };
}
