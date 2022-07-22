import { Component, ElementRef, HostListener, Renderer2, ViewEncapsulation } from '@angular/core';
import * as uuid from "uuid";

interface Entity {
  name: string;
  colorCode: string;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  content =
    "You can you the keyframe percentages in any order; they will be handled in the order they should occur. JavaScript can access the @keyframes at-rule with the CSS object model interface CSSKeyframesRule. Valid keyframe lists If a keyframe rule doesn't specify the start or end states of the animation (that is, 0%/from and 100%/to), browsers will use the element's existing styles for the start/end states. This can be used to animate an element from its initial state and back. Properties that can't be animated in keyframe rules are ignored, but supported properties will st";

  entities: Entity[] = [{
    name: 'place',
    colorCode: 'rgba(255, 0, 0, .2)'
  },
  {
    name: 'food',
    colorCode: 'rgba(0, 0, 255, .2)',
  },
  {
    name: 'date',
    colorCode: 'rgba(0, 255, 0, .2)'
  }
  ];
  selectedEntity: string = this.entities[0].name;
  // selectedTextMap = new Map<string, { markedText: string, entityName: string, position?: { start: number, end: number } }>();
  selectedTextMap = new Map<string, { markedText: string, entityName: string }>();

  entityColorMap = new Map<string, string>();

  constructor(
    private renderer: Renderer2,
    private el: ElementRef
  ) {
  }

  ngOnInit() {

    this.content = "<p id='content'>" + this.content.replace(/[\w|\d|.*|\s|^...|';:]/g, (str, p1, offset, s) => {
      return `<span style="position: relative;" id=char-${p1} data-index=${p1}>${str}</span>`;
    }) + "</p>";

    this.getEntities();
  }

  getEntities() {
    if (this.entities && this.entities.length) {
      this.entities.forEach(en => {
        this.entityColorMap.set(en.name, en.colorCode)
      })
    }
  }

  getSelectedText() {
    if (window && window.getSelection) {
      return window.getSelection()?.toString();
    }
    return '';
  }

  onSelectEntity(entityName: string) {
    this.selectedEntity = entityName;
  }

  markSelectedText() {
    // console.log(this.el.nativeElement.querySelector('#content').innerHTML = this.htmlContent);

    const selection = window.getSelection();
    if (selection &&
      selection.rangeCount &&
      selection.anchorOffset !== selection.focusOffset
      // && selection.focusNode?.parentElement?.id === 'content'
    ) {
      // const range = selection.getRangeAt(0).cloneRange();

      const range = selection.getRangeAt(0);
      if (range.toString().trim() === '') {
        return;
      }

      const startIndexOfSelection = (selection.getRangeAt(0).startContainer.parentNode as HTMLElement).dataset['index'] || '0';
      const selectionIndices = Array.apply(0, Array(range.toString().length)).map((el, index) => index + parseInt(startIndexOfSelection));
      const selectedTextMapKey = selectionIndices[0] + "," + selectionIndices[selectionIndices.length - 1];

      // The selected text has been marked
      if (this.selectedTextMap.get(selectedTextMapKey)) {
        return;
      }
      this.selectedTextMap.set(selectedTextMapKey, { markedText: range.toString(), entityName: this.selectedEntity });
      selectionIndices.length && selectionIndices.forEach(index => {
        this.renderer.setStyle(this.el.nativeElement.querySelector(`#char-${index}`), 'background-color', this.entityColorMap.get(this.selectedEntity));
      })

      // const entityHighligterSpan = this.createEntityHightlighterSpan();
      try {
        // range.surroundContents(entityHighligterSpan);
        // selection.removeAllRanges();
        // selection.addRange(range);

        const entityNameSpan = this.createEntityNameSpan();
        const lastCharElementOfSelection = this.el.nativeElement.querySelector(`#char-${selectionIndices[selectionIndices.length - 1]}`);
        this.renderer.appendChild(lastCharElementOfSelection, entityNameSpan);


      } catch (error) {
        console.log(error);
      }
    }
  }

  createEntityHightlighterSpan(): HTMLElement {
    const spanId = uuid.v4();
    const span: HTMLElement = this.renderer.createElement('span');
    this.renderer.setStyle(span, 'background-color', this.entityColorMap.get(this.selectedEntity) || '');
    this.renderer.setStyle(span, 'position', 'relative');
    this.renderer.setProperty(span, 'id', spanId);
    this.renderer.addClass(span, this.selectedEntity);
    this.renderer.addClass(span, 'innerTag');
    return span;
  }

  createEntityNameSpan(): HTMLElement {
    const entitySpan = this.renderer.createElement('span');
    this.renderer.setProperty(entitySpan, 'innerHTML', '[' + this.selectedEntity + ']');
    this.renderer.addClass(entitySpan, 'innerTag');
    this.renderer.setStyle(entitySpan, 'background-color', this.entityColorMap.get(this.selectedEntity) || '');
    this.renderer.setStyle(entitySpan, 'position', 'absolute');
    this.renderer.setStyle(entitySpan, 'top', '100%');
    this.renderer.setStyle(entitySpan, 'right', '-5%');
    this.renderer.setStyle(entitySpan, 'font-size', '60%');
    this.renderer.setStyle(entitySpan, 'line-height', 'normal');
    return entitySpan;
  }

  mouseUp() {
    this.markSelectedText();
  }

  onMarkAll(text: string, entityName: string) {
    const indexes = [...this.content.matchAll(new RegExp(text, 'gi'))].map(a => a.index).map(index => index && index - 16);
    // console.log(text, ": ", entityName);
    const selectionId = uuid.v4();
    const regex = new RegExp(text, 'g');
    this.content = this.content.replace(
      regex,
      (match, contents, offset, input_string) => {
        return `<span class='${this.selectedEntity}' #${selectionId} style="background-color:${this.entityColorMap.get(entityName)}">${text}</span>`
      }
    );
    indexes.length && indexes.forEach(startAt => {
      // startAt && this.selectedTextMap.get(this.selectedEntity)?.push({ selection: text, position: { start: startAt, end: text.length } });
    })
  }

}



// background-image: 
//     linear-gradient(
//       rgba(120,0,200,0.5),
//       rgba(120,0,200,0.5)
//     ),
//     linear-gradient(
//       rgba(200,200,200,0.5),
//       rgba(200,200,200,0.5)
//     );