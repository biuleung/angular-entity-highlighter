import { Component, ElementRef, Renderer2, ViewEncapsulation } from '@angular/core';

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
  content: string = '';

  htmlContent: string = '';

  entities: Entity[] = [{
    name: 'nation',
    colorCode: 'rgba(255, 0, 0, .2)'
  },
  {
    name: 'person',
    colorCode: 'rgba(0, 0, 255, .2)',
  },
  {
    name: 'date',
    colorCode: 'rgba(0, 255, 0, .2)'
  }
  ];
  newEntity: string = '';
  selectedEntity: string = this.entities[0].name;
  MarkedTextMap = new Map<string, { markedText: string, entityName: string }>();

  entityColorMap = new Map<string, string>();

  constructor(
    private renderer: Renderer2,
    private el: ElementRef
  ) {
  }

  ngOnInit() {
    this.getContent();
    this.convertContentToHtmlContent();
    this.getEntities();
  }

  getContent() {
    this.content =
      'Mr Lavrov said that Western nations "aggressiveness" in imposing sanctions on Russia indicated one simple conclusion: "It is not about Ukraine, it is about the future of the world order. "They say everybody must support a rules - based world order, and the rules are written depending on what specific situation the West wants to resolve in its own favour." Earlier, Mr Lavrov held talks with his Egyptian counterpart, Sameh Shoukry. Egypt has significant ties with Russia, which supplies wheat, weapons and - until the invasion of Ukraine began - large numbers of tourists. After his talks with Mr Shoukry, Mr Lavrov told a joint news conference that the West was prolonging the conflict even though it understood "what and whose end it will be".'
    // this.content = '與此同時，世界上一些最發達的經濟體已經出現人口下降，生育率降至每名婦女生育2.1個孩子以下，這被稱為"人口替代率"。（注：這一概念指的是一個地區人口出生與死亡能維持某種相對的平衡）報告稱，到2050年，有61個國家的人口將減少至少1%。中國是世界上生育率最低的國家之一（平均每名婦女生育1.15個孩子），中國預計其人口將於明年開始下降，比此前預計的要早得多。中國在2016年全面放棄了獨生子女政策，並出台了鼓勵夫婦生育兩個或兩個以上孩子的政策。'

  }

  convertContentToHtmlContent() {
    this.htmlContent = "<p id='content'>" + this.content.replace(/[\w|\d|.|\s|^...|\-\_"';:@,%/)(]/g, (char, index) => {
      return `<span style="position: relative;" id=char-${index} data-index=${index}>${char}</span>`;
    }) + "</p>";
  }

  getEntities() {
    this.setupEntityColorMap();
  }

  setupEntityColorMap() {
    if (this.entities && this.entities.length) {
      this.entities.forEach(en => {
        this.entityColorMap.set(en.name, en.colorCode)
      })
    }
  }

  onSelectEntity(entityName: string) {
    this.selectedEntity = entityName;
  }

  onNewEntity() {
    this.entities.push({
      name: this.newEntity,
      colorCode: `rgba(${Math.random() * (255)}, ${Math.random() * (255)}, ${Math.random() * (255)}, .2)`
    });
    this.setupEntityColorMap();
    this.newEntity = '';
  }

  markSelectedText() {
    const selection = window.getSelection();
    if (selection &&
      selection.rangeCount &&
      selection.anchorOffset !== selection.focusOffset
      && selection.focusNode?.parentElement?.parentElement?.id === 'content'
    ) {
      // select nothing or space
      let selectedString = selection.getRangeAt(0).toString().trim();
      if (selectedString === '') {
        return;
      }

      // ignore the entity spans
      selectedString = selectedString.replace(/(\[.*?\])*/g, "");

      const startIndexOfSelection = (selection.getRangeAt(0).startContainer.parentNode as HTMLElement).dataset['index'] || '0';
      const selectionIndices = this.getSelectionIndexRange(startIndexOfSelection, selectedString.length);
      const markedTextMapKey = this.convertSelectionIndicesToMarkedTextKey(selectionIndices);

      // The selected text has been marked
      if (this.MarkedTextMap.get(markedTextMapKey)) {
        if (this.MarkedTextMap.get(markedTextMapKey)?.entityName === this.selectedEntity) {
          return;
        } else {
          this.removeEntityNameFromMarkedText(selectionIndices);
        }
      }
      this.modifyMarkTextMap(markedTextMapKey, selectedString);
      this.styleMarkedText(selectionIndices);
      this.attachEntityNameToMarkedText(selectionIndices);
      this.attachRemoveBtnToMarkedText(selectionIndices);
    }
  }

  convertSelectionIndicesToMarkedTextKey(selectionIndices: number[]) {
    return selectionIndices[0] + "," + selectionIndices[selectionIndices.length - 1];
  }

  convertMarkedTextKeyToSelectionIndices(mapKey: string): number[] {
    if (mapKey && mapKey.trim() !== '') {
      const range = mapKey.split(',')
      return this.getSelectionIndexRange(range[0], (parseInt(range[1]) - parseInt(range[0]) + 1))
    }
    return [];
  }

  getSelectionIndexRange(startIndex: string, stringLength: number) {
    return Array.apply(0, Array(stringLength)).map((el, index) => index + parseInt(startIndex));
  }

  modifyMarkTextMap(markedTextMapKey: string, markedText: string) {
    this.MarkedTextMap.set(markedTextMapKey, { markedText: markedText, entityName: this.selectedEntity });
  }

  createEntityNameSpan(entityName: string): HTMLElement {
    const entitySpan = this.renderer.createElement('span');
    this.renderer.setProperty(entitySpan, 'innerHTML', '[' + entityName + ']');
    this.renderer.addClass(entitySpan, 'innerTag');
    this.renderer.setStyle(entitySpan, 'background-color', this.entityColorMap.get(entityName) || '');
    this.renderer.setStyle(entitySpan, 'position', 'absolute');
    this.renderer.setStyle(entitySpan, 'top', '100%');
    this.renderer.setStyle(entitySpan, 'right', '-5%');
    this.renderer.setStyle(entitySpan, 'font-size', '60%');
    this.renderer.setStyle(entitySpan, 'line-height', 'normal');
    return entitySpan;
  }

  createRemoveBtn(selectionIndices: number[]): HTMLElement {
    const entityRemoveBtn = this.renderer.createElement('button');
    this.renderer.addClass(entityRemoveBtn, 'clear');
    this.renderer.setAttribute(entityRemoveBtn, 'data-marked-text-key', this.convertSelectionIndicesToMarkedTextKey(selectionIndices));
    this.renderer.listen(entityRemoveBtn, 'click', this.onRemoveClick.bind(this));
    return entityRemoveBtn;
  }

  onRemoveClick(e: PointerEvent) {
    const btn = e.target as HTMLElement;
    const textKey = btn.dataset['markedTextKey'];
    if (textKey) {
      this.MarkedTextMap.delete(textKey);
      this.removeUnmarkTextStyling(this.convertMarkedTextKeyToSelectionIndices(textKey));
      this.removeUnmarkTextAttachedElements(this.convertMarkedTextKeyToSelectionIndices(textKey));
    }
  }

  styleMarkedText(selectionIndices: number[], entityName = this.selectedEntity) {
    selectionIndices.length && selectionIndices.forEach(index => {
      this.renderer.setStyle(this.el.nativeElement.querySelector(`#char-${index}`), 'background-color', this.entityColorMap.get(entityName));
      this.renderer.addClass(this.el.nativeElement.querySelector(`#char-${index}`), 'marked');
    })
  }

  attachEntityNameToMarkedText(selectionIndices: number[], entityName = this.selectedEntity) {
    const entityNameSpan = this.createEntityNameSpan(entityName);
    const lastCharElementOfSelection = this.el.nativeElement.querySelector(`#char-${selectionIndices[selectionIndices.length - 1]}`);
    this.renderer.appendChild(lastCharElementOfSelection, entityNameSpan);
  }

  attachRemoveBtnToMarkedText(selectionIndices: number[]) {
    const entityRemoveBtn = this.createRemoveBtn(selectionIndices);
    const lastCharElementOfSelection = this.el.nativeElement.querySelector(`#char-${selectionIndices[selectionIndices.length - 1]}`);
    this.renderer.appendChild(lastCharElementOfSelection, entityRemoveBtn);
  }


  removeUnmarkTextStyling(selectionIndices: number[]) {
    selectionIndices.length && selectionIndices.forEach(index => {
      this.renderer.removeStyle(this.el.nativeElement.querySelector(`#char-${index}`), 'background-color');
      this.renderer.removeStyle(this.el.nativeElement.querySelector(`#char-${index}`), 'border');
      this.renderer.removeClass(this.el.nativeElement.querySelector(`#char-${index}`), 'marked');
    })
  }

  removeUnmarkTextAttachedElements(selectionIndices: number[]) {
    const lastCharElementOfSelection: HTMLElement = this.el.nativeElement.querySelector(`#char-${selectionIndices[selectionIndices.length - 1]}`);

    // If the node is a text node, the nodeType property will return 3.
    while (lastCharElementOfSelection.hasChildNodes() && lastCharElementOfSelection?.lastChild?.nodeType !== 3) {
      if (lastCharElementOfSelection.lastChild) {
        lastCharElementOfSelection.removeChild(lastCharElementOfSelection.lastChild);
      }
    }
  }

  removeEntityNameFromMarkedText(selectionIndices: number[]) {
    const lastCharElementOfSelection: HTMLElement = this.el.nativeElement.querySelector(`#char-${selectionIndices[selectionIndices.length - 1]}`);
    this.renderer.removeChild(lastCharElementOfSelection, lastCharElementOfSelection.childNodes[1]);
  }

  mouseUp() {
    this.markSelectedText();
  }

  onMarkedTextHover(textKey: string, entityName: string) {
    const hoveredSelectionIndices = this.convertMarkedTextKeyToSelectionIndices(textKey);
    if (hoveredSelectionIndices && hoveredSelectionIndices.length) {
      this.renderer.setStyle(
        this.el.nativeElement.querySelector(`#char-${hoveredSelectionIndices[0]}`),
        'border',
        `2px solid ${this.entityColorMap.get(entityName)?.replace('.2', '.5')}`
      );
      this.renderer.setStyle(
        this.el.nativeElement.querySelector(`#char-${hoveredSelectionIndices[0]}`),
        'border-right',
        `none`
      );

      hoveredSelectionIndices.forEach((item, index) => {
        if (index === 0) {
          return;
        }

        if (index === hoveredSelectionIndices.length - 1) {
          this.renderer.setStyle(
            this.el.nativeElement.querySelector(`#char-${item}`),
            'border-right',
            `2px solid ${this.entityColorMap.get(entityName)?.replace('.2', '.5')}`
          );
        }

        this.renderer.setStyle(
          this.el.nativeElement.querySelector(`#char-${item}`),
          'border-top',
          `2px solid ${this.entityColorMap.get(entityName)?.replace('.2', '.5')}`
        );
        this.renderer.setStyle(
          this.el.nativeElement.querySelector(`#char-${item}`),
          'border-bottom',
          `2px solid ${this.entityColorMap.get(entityName)?.replace('.2', '.5')}`
        );
      })
    }
  }

  onMarkedTextLeave(textKey: string) {
    const hoveredSelectionIndices = this.convertMarkedTextKeyToSelectionIndices(textKey);
    hoveredSelectionIndices.forEach((item, index) => {
      this.renderer.setStyle(
        this.el.nativeElement.querySelector(`#char-${item}`), 'border', 'none'
      );
    })
  }

  onRemoveMarkedText(textKey: string) {
    this.MarkedTextMap.delete(textKey);
    this.removeUnmarkTextStyling(this.convertMarkedTextKeyToSelectionIndices(textKey));
    this.removeUnmarkTextAttachedElements(this.convertMarkedTextKeyToSelectionIndices(textKey));

  }

  onMarkAll(entityName: string, markedText: string) {
    const indices = [...this.content.matchAll(new RegExp(markedText, 'gi'))].map(a => a.index).map(index => index && index);
    let allOccurencesMapKey = indices.map(index => index + ',' + (typeof index === 'number' && index + markedText.length - 1));

    allOccurencesMapKey.forEach(a => {
      if (this.MarkedTextMap.get(a)) {
        allOccurencesMapKey = allOccurencesMapKey.filter(item => a !== item)
      }
    });
    allOccurencesMapKey.forEach(mk => {
      this.MarkedTextMap.set(mk, { markedText: markedText, entityName: entityName });
      const selectionIndices = this.getSelectionIndexRange(mk.split(',')[0], markedText.length);
      this.styleMarkedText(selectionIndices, entityName);
      this.attachEntityNameToMarkedText(selectionIndices, entityName);
      this.attachRemoveBtnToMarkedText(selectionIndices);
    });
  }
}
