import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import InsertButtonCommand from './insertButtonCommand';
import RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';

import { BUTTON_ELEMENT } from './constants';
import { INSERT_BUTTON_COMMAND } from './constants';

export default class ButtonEditing extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	/**
	 * @type {RootElement} The root element of the document.
	 */
	get rootElement() {
		const rootElement = this.editor.model.document.getRoot();
		if(!rootElement) {
			throw new Error('Document has no rootElement element.');
		}
		return rootElement;
	}

	init() {
		const { schema } = this.editor.model;
		const { conversion } = this.editor;
		
		schema.register(BUTTON_ELEMENT, {
			isObject: true,
			allowWhere: '$block',
		});
		// (model → editing view)
		conversion.for('editingDowncast').elementToElement({
			model: BUTTON_ELEMENT,
			view: (_, conversionApi) => {
				const viewWriter = conversionApi.writer;
				const button = viewWriter.createContainerElement('span', {
					'data-button': true,
					'data-button-text': 'test',
				});
				const text = viewWriter.createText('test');
				viewWriter.insert(viewWriter.createPositionAt(button, 0), text);

				return toWidget(button, viewWriter);
			}
		});
		// (model → editing view)
		conversion.for('upcast').elementToElement({
			view: {
				attributes: {
					'data-button': true,
				},
			},
			model: BUTTON_ELEMENT,
		});

		this.editor.commands.add( INSERT_BUTTON_COMMAND, new InsertButtonCommand( this.editor ) );
	}

}
