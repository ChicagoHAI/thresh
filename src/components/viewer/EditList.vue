<script setup>
import VRuntimeTemplate from "vue3-runtime-template";
import _ from 'lodash';
import { LeaderLine } from '../../assets/js/leader-line.min.js';
</script>

<script>
export default {
    props: [
        'hits_data',
        'set_hits_data',
        'current_hit',
        'edits_dict',
        'set_edits_dict',
        'editor_open',
        'set_editor_state',
        'refresh_interface_edit',
        'annotating_edit_span_category_id',
        'set_annotating_edit_span_category_id',
        'annotating_edit_span',
        'set_annotating_edit_span',
        'lines',
        'set_lines',
        'config'
    ],
    data() {
        return {
            edits_html: "",
            line_locked: false
        }
    },
    watch: {
        current_hit() {
            $(`#circle-${this.current_hit}`).addClass('circle-active');
            this.process_edits_html();
            this.draw_lines();
        },
        hits_data() {
            this.process_edits_html();
            this.draw_lines();
        },
        edits_dict() {
            this.draw_lines();
        },
    },
    methods: {
        annotate_edit(e) {
            const original_sentence = this.hits_data[this.current_hit - 1].original
            const simplified_sentence = this.hits_data[this.current_hit - 1].simplified
            const edit_dict = this.edits_dict

            const category = e.target.dataset.category
            const id = e.target.dataset.id
            const real_id = parseInt(e.target.dataset.id.split("-")[1])

            $(".child-question").hide();
            if (this.editor_open) {
                $(`.quality-selection[data-category=${category}]`).hide(400);
                this.refresh_interface_edit();
                return;
            } else {
                $(`.quality-selection`).hide(400)
                $(`.quality-selection[data-category=${category}]`).slideDown(400);
                $(e.target).addClass(`txt-${category}`)
                this.set_editor_state(!this.editor_open)
            }
            $(`.${category}[data-id=${id}]`).removeClass(`border-${category}-light`).addClass(`white border-${category} bg-${category}`)

            let annotating_span = edit_dict.find(function(entry) {
                return entry['category'] === category && entry['id'] === real_id;
            });

            if (this.getEditConfig(category)['multi_span']) {
                let original_spans_for_subs = edit_dict[category][real_id]["original"]
                let simplified_spans_for_subs = edit_dict[category][real_id]["simplified"]
                let new_edit_span = ""
                for (let i = 0; i < original_spans_for_subs.length; i++) {
                    if (i != 0) {
                        new_edit_span += `<span class="edit-type txt-${category} f3"> and </span>`
                    }
                    new_edit_span += `<span class="pa1 edit-text br-pill-ns txt-${category} border-${category}-all ${category}_below">
                        &nbsp${original_sentence.substring(original_spans_for_subs[i][1], original_spans_for_subs[i][2])}&nbsp</span>`
                }
                this.set_annotating_edit_span(new_edit_span, 'original')
                new_edit_span = ""
                for (let i = 0; i < simplified_spans_for_subs.length; i++) {
                    if (i != 0) {
                        new_edit_span += `<span class="edit-type txt-${category} f3"> and </span>`
                    }
                    new_edit_span += `<span class="pa1 edit-text br-pill-ns txt-${category} border-${category}-all ${category}_below">
                        &nbsp${simplified_sentence.substring(simplified_spans_for_subs[i][1], simplified_spans_for_subs[i][2])}&nbsp</span>`
                }
                this.set_annotating_edit_span(new_edit_span, 'simplified')
            } else if (this.getEditConfig(category)['type'] == 'composite') {
                let new_edit_span = ""
                let light = ""
                
                for (let j = 0; j < annotating_span['constituent_edits'].length; j++) {
                    const constituent_edit = annotating_span['constituent_edits'][j];
                    const constituent_key = constituent_edit['category'];

                    new_edit_span += this.render_edit_text(constituent_edit, real_id, constituent_key, light)
                    if (j != annotating_span['constituent_edits'].length - 1) {
                        new_edit_span += `<span class="edit-type txt-${category}${light} f3"> , </span>`;
                    } else {
                        new_edit_span += `<span class="edit-type txt-${category}${light} f3"> )</span>`;
                    }
                }

                this.set_annotating_edit_span(new_edit_span, '', 'structure')
            } else {
                if (annotating_span.hasOwnProperty('input_idx')) {
                    let span_idx = annotating_span['input_idx'][0]
                    this.set_annotating_edit_span(original_sentence.substring(span_idx[0], span_idx[1]), 'original')
                } 

                if (annotating_span.hasOwnProperty('output_idx')) {
                    let span_idx = annotating_span['output_idx'][0]
                    this.set_annotating_edit_span(simplified_sentence.substring(span_idx[0], span_idx[1]), 'simplified')
                }
            }

            this.set_annotating_edit_span_category_id(real_id)
        },
        trash_edit(e) {
            const real_id = parseInt(e.target.dataset.id.split("-")[1])
            const category = e.target.dataset.category
            const old_edits_list = this.hits_data[this.current_hit - 1]["edits"]
            
            let new_edits_list = []
            for (const old_edit of old_edits_list) {
                if (old_edit["id"] == real_id && old_edit["category"] == category) {
                    continue
                }
                new_edits_list.push(old_edit)
            }

            let new_hits_data = _.cloneDeep(this.hits_data);
            new_hits_data[this.current_hit - 1]["edits"] = new_edits_list
            this.set_hits_data(new_hits_data);
        },
        hasAnnotation(edit) {
            return edit['annotation'] != null
        },
        getEditConfig(category) {
            if (!this.config.hasOwnProperty('edits')) { return {}; }
            return this.config['edits'].find(function(entry) {
                return entry['name'] === category;
            });
        },
        getAnnotationHtml(ann_config, ann) {
            if (ann == null) {
                return '';
            }
            
            let ann_html = ''
            for (let edit_ann_type of ann_config) {
                let ann_type_name = edit_ann_type['name']

                if (!edit_ann_type.hasOwnProperty('options')) {
                    continue
                }

                if (edit_ann_type['options'] == 'binary') {
                    if (ann[ann_type_name] == "yes") {
                        // ann_html += ` <span class="brown ba bw1 pa1 br-100">G</span>`;
                        // ann_html += ` <span class="brown ba bw1 pa1 br-pills">Coref error</span>`;
                        ann_html += ` <span class="brown ba bw1 pa1 br-pills">${ann_type_name}</span>`;
                    }
                } else if (edit_ann_type['options'] == 'likert-3') {
                    if (ann[ann_type_name] != null) {
                        ann_html += `<span class="light-pink br-pills ba bw1 pa1">${ann_type_name}: ${ann[ann_type_name]}</span>`;
                    }
                } else {
                    // custom edit types
                    let selected = ann[ann_type_name]["val"]
                    if (selected != null && selected != "") {
                        ann_html = `<span class="light-purple ba bw1 pa1">${selected}</span>`

                        if (edit_ann_type.hasOwnProperty('options')) {
                            ann_html += this.getAnnotationHtml(edit_ann_type['options'], ann[ann_type_name])
                        }
                    }                            
                } 
            }
            return ann_html
        },
        render_edit_text(edit, i, key, light) {
            let new_html = ''
            new_html += `
                <span data-id="${key}-${i}" data-category="${key}" class="default_cursor" @mouseover="hover_span" @mouseout="un_hover_span">
                    <span class="edit-type txt-${key}${light} f3">${key} </span>
                    <span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">`;

            if (edit.hasOwnProperty('input_idx')) {
                let in_span = edit['input_idx'][0]
                new_html += `
                    &nbsp${this.hits_data[this.current_hit - 1].original.substring(in_span[0], in_span[1])}&nbsp</span>`;
            } else if (edit.hasOwnProperty('output_idx')) {
                let out_span = edit['output_idx'][0]
                new_html += `
                    &nbsp${this.hits_data[this.current_hit - 1].simplified.substring(out_span[0], out_span[1])}&nbsp</span>`;
            }
            
            if (this.getEditConfig(key)['multi_span']) {
                if (edit.hasOwnProperty('input_idx')) {
                    let original_spans_for_subs = edit['input_idx'].slice(1)
                    for (let original_span of original_spans_for_subs) {
                        if (original_span[0] != in_span[0] || original_span[1] != in_span[1]) {
                            new_html += `
                                <span class="edit-type txt-${key}${light} f3"> and </span>
                                    <span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">
                                        &nbsp${this.hits_data[this.current_hit - 1].original.substring(original_span[0], original_span[1])}&nbsp
                                    </span>`;
                        }
                    }
                }
                new_html += `<span class="edit-type txt-${key}${light} f3"> with </span>`;
                if (edit.hasOwnProperty('output_idx')) {
                    let simplified_spans_for_subs = edit['output_idx'] // .slice(1)
                    for (let j = 0; j < simplified_spans_for_subs.length; j++) {
                        let simplified_span = simplified_spans_for_subs[j];
                        if (j != 0) {
                            new_html += `<span class="edit-type txt-${key}${light} f3"> and </span>`;
                        }
                        new_html += `
                            <span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">
                                &nbsp${this.hits_data[this.current_hit - 1].simplified.substring(simplified_span[0], simplified_span[1])}&nbsp</span>`;
                    }
                }
            } 
            return new_html
        },
        process_edits_html() {
            let new_html = ''

            let hit_edits = _.cloneDeep(this.hits_data[this.current_hit - 1].edits)

            // TODO: Sort edits

            for (let edit of hit_edits) {
                let i = edit['id']
                let key = edit['category'];
                let light = !this.hasAnnotation(edit) ? "-light" : ""
                new_html += `
                    <div class='cf'>
                        <div class="fl w-80 mb4 edit">`;
                
                // Render edit
                if (this.getEditConfig(key)['type'] == 'composite') {
                    const composite_icon = this.getEditConfig(key)['icon']
                    new_html += `
                        <span data-id="${key}-${i}" data-category="${key}" class="default_cursor" @mouseover="hover_span" @mouseout="un_hover_span">
                            <span class="edit-type txt-${key}${light} f3">${key} </span>
                            <span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">
                                &nbsp<i class="fa-solid ${composite_icon}"></i>&nbsp</span>
                                <span class="edit-type txt-${key}${light} f3"> (</span>`;
                    
                    for (let j = 0; j < edit['constituent_edits'].length; j++) {
                        const constituent_edit = edit['constituent_edits'][j];
                        const constituent_key = constituent_edit['category'];

                        new_html += this.render_edit_text(constituent_edit, i, constituent_key, light)
                        if (j != edit['constituent_edits'].length - 1) {
                            new_html += `<span class="edit-type txt-${key}${light} f3"> , </span>`;
                        } else {
                            new_html += `<span class="edit-type txt-${key}${light} f3"> )</span>`;
                        }
                    }
                } else {
                    new_html += this.render_edit_text(edit, i, key, light)
                }
                
                new_html += ` : `;

                // Render annotation
                if (!this.hasAnnotation(edit)) {
                    new_html += `
                        <span class="f4 i black-60">this edit is not annotated yet, click <i class="fa-solid fa-pencil"></i> to start!</span>
                    `;
                } else {
                    const edit_config = this.getEditConfig(key)
                    let ann_html = this.getAnnotationHtml(edit_config['annotation'], edit['annotation'])
                    new_html += `<span class="f4 i">${ann_html}</span>`;
                }

                new_html += `
                        </span>
                    </div>
                    <div class="fl w-20 mb4 operation tc">
                        <i @click="annotate_edit" class="annotation-icon fa-solid fa-pencil mr3 pointer dim" data-id="${key}-${i}" data-category="${key}"></i>
                        <i @click="trash_edit" class="fa-solid fa-trash-can ml4 pointer dim" data-id="${key}-${i}" data-category="${key}"></i>
                    </div>
                </div>`;
            }
            
            this.set_edits_dict(hit_edits);
            this.edits_html = new_html;
        },
        clear_lines: function() {
            // Remove existing lines as defined by LeaderLine
            let old_lines = this.lines
            for (let category in old_lines) {
                for (let i in old_lines[category]) {
                    if (old_lines[category][i] instanceof Array) {
                        for (let j in old_lines[category][i]) {
                            if (old_lines[category][i][j] != null) {
                                old_lines[category][i][j].remove()
                            }
                            old_lines[category][i][j] = null
                        }
                    } else {
                        if (old_lines[category][i] != null) {
                            old_lines[category][i].remove()
                        }
                        old_lines[category][i] = null
                    }
                }
            }
        },
        draw_lines: function() {
            // There's some latency in this function, the locking ensures no line references are lost
            if (this.line_locked) { return }
            this.line_locked = true

            this.clear_lines()

            let new_lines = Object.fromEntries(this.config.edits.map(t => [t.name, {}]));

            let hit_edits = _.cloneDeep(this.hits_data[this.current_hit - 1].edits)

            for (let edit of hit_edits) {
                let id = edit['id']
                let key = edit['category'];
                const edit_config = this.getEditConfig(key)

                const line_config = {
                    endPlug: "behind",
                    size: 3,
                    path: "straight"
                }

                let color = "rgba(173, 197, 250, 0.4)"
                // let color = "rgba(182, 227, 229, 0.4)" // reorder
                if (this.hasAnnotation(edit)) {
                    color = "rgba(33, 134, 235, 0.46)"
                    // color = "rgba(60, 163, 167, 0.46)" // reorder
                }
                line_config.color = color

                if (edit_config['type'] == 'composite') {
                    for (let constituent_edit of edit['constituent_edits']) {
                        new_lines[key][id] = []
                        const cid = constituent_edit['id']
                        const ccategory = constituent_edit['category']
                        const constituent_edit_config = this.getEditConfig(ccategory)

                        if (constituent_edit_config['enable_input'] && constituent_edit_config['enable_output']) {
                            new_lines[key][id].push(
                                new LeaderLine(
                                    $(`.${key}.original_span[data-id='${key}-${id}'][data-childcategory=${ccategory}][data-childid=${cid}]`)[0],
                                    $(`.${key}.simplified_span[data-id='${key}-${id}'][data-childcategory=${ccategory}][data-childid=${cid}]`)[0],
                                    line_config
                                )
                            )
                        }
                    }
                } else if (edit_config['enable_input'] && edit_config['enable_output']) {
                    if ($(`.${key}.original_span`)[0] == null) {
                        console.error("Something went wrong!")
                    }

                    new_lines[key][id] = new LeaderLine(
                        $(`.${key}.original_span[data-id='${key}-${id}']`)[0],
                        $(`.${key}.simplified_span[data-id='${key}-${id}']`)[0],
                        line_config
                    )
                }
            }

            // TODO: This is essentially code which points from split edits to other edits
            // let split_edits_dict = this.edits_dict["split"]
            // if (split_edits_dict != {}) {
            //     for (let id in split_edits_dict) {
            //         let color = "rgba(250, 229, 175, 0.4)"
            //         if (("annotations" in this.hits_data[[this.current_hit - 1]]) && (id in this.hits_data[[this.current_hit - 1]].annotations["split"])) {
            //             color = "rgba(247, 206, 70, 0.46)"
            //         }
            //         new_lines["split"][id] = []
            //         for (let span_category in split_edits_dict[id]) {
            //             for (let span_id in split_edits_dict[id][span_category]) {
            //                 let css_config = `[data-id='split-${id}'][data-childcategory=${span_category}][data-childid=${span_id}]`
            //                 const line_config = {
            //                     endPlug: "arrow3",
            //                     size: 3,
            //                     path: "arc",
            //                     color: color
            //                 }
            //                 if (span_category == "deletion") {
            //                     new_lines["split"][id].push(
            //                         new LeaderLine(
            //                         $(`.split.original_span${css_config}`)[0],
            //                         $(`.split.split-sign[data-id='split-${id}']`)[0],
            //                         line_config)
            //                     )
            //                 } else if (span_category =="insertion") {
            //                     new_lines["split"][id].push(
            //                         new LeaderLine(
            //                         $(`.split.simplified_span${css_config}`)[0],
            //                         $(`.split.split-sign[data-id='split-${id}']`)[0],
            //                         line_config)
            //                     )
            //                 } else if (span_category == "substitution" || span_category == "reorder") {
            //                     new_lines["split"][id].push(
            //                         new LeaderLine(
            //                         $(`.split.original_span${css_config}`)[0],
            //                         $(`.split.simplified_span${css_config}`)[0],
            //                         line_config)
            //                     )

            //                     new_lines["split"][id].push(
            //                         new LeaderLine(
            //                         $(`.split.simplified_span${css_config}`)[0],
            //                         $(`.split.split-sign[data-id='split-${id}']`)[0],
            //                         line_config)
            //                     )
            //                 }
            //             }
            //         }
            //     }
            // }

            this.set_lines(new_lines)
            this.line_locked = false
        }
    },
    computed: {
        get_edits_html() {
            return {
                template: `<div id="edits_html" class="f4 lh-paras">${this.edits_html}</div>`,
                methods: {
                    annotate_edit: this.annotate_edit,
                    trash_edit: this.trash_edit,
                }
            }
        }
        // Unused methods
        // hover_span: this.hover_span,
        // un_hover_span: this.un_hover_span,
    },
    created() {
        window.addEventListener("resize", this.draw_lines);
    },
    destroyed() {
        window.removeEventListener("resize", this.draw_lines);
    },
}
</script>

<template>
    <component :is="get_edits_html"></component> 
</template>