<script setup>
  import Sent from "./Sent.vue";
  import _ from 'lodash';
//   import { handle_file_download, handle_file_upload } from "../../assets/js/file-util.js";
  import VueMarkdown from 'vue-markdown-render'
  import { initializeApp } from 'firebase/app'
  import { getFirestore, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
</script>

<script>
export default {
    components: {
        VueMarkdown
    },
    props: [
        'hits_data',
        'current_hit',
        'total_hits',
        'edits_dict',
        'set_hit',
        'selected_state',
        'selected_edits_html',
        'selected_edits',
        'set_selected_edits',
        'set_span_text',
        'set_span_indices',
        'set_edit_html',
        'set_span_category',
        'refresh_interface_edit',
        'set_hits_data',
        'lines',
        'set_lines',
        'config',
        'hit_box_config',
        'toggle_instructions'
    ],
    data() {
        return {
            showContext: false
        }
    },
    watch: {
        current_hit() {
            this.setup_hit_box();
        },
        hits_data() {
            this.setup_hit_box();
        },
        showContext() {
            
        }
    },
    methods: {
        setup_hit_box() {
            $(`#comment_area`).val('');
            if ("comment" in this.hits_data[this.current_hit - 1]) {
                $(`#comment_area`).val(this.hits_data[this.current_hit - 1]["comment"]);
            }
            if (this.showConfigToggle()) {
                $('.context-container').hide(0);
                this.showContext = false;
            } else {
                $('.context-container').show(0);
            }
        },
        get_circle_class(n) {
            let class_name = 'circle-' + n
            if (n == this.current_hit) {
                class_name += ' circle-active'
            }
            if (this.hits_data && "bookmark" in this.hits_data[n - 1] && this.hits_data[n - 1]["bookmark"]) {
                class_name += ' circle-bookmark'
            }
            return class_name
        },
        get_bookmark_class() {
            if (this.hits_data && "bookmark" in this.hits_data[this.current_hit - 1] && this.hits_data[this.current_hit - 1]["bookmark"]) {
                return 'bookmark-active'
            }
            return ''
        },
        go_to_hit(hit_num) {
            if (hit_num > this.total_hits) {
                this.set_hit(this.total_hits);
            } else if (hit_num < 1) {
                this.set_hit(1);
            } else {
                this.set_hit(hit_num);
            }
            this.setup_hit_box();
        },
        go_to_hit_circle(hit_num) {
            if (hit_num > this.total_hits) {
                this.set_hit(this.total_hits);
            } else if (hit_num < 1) {
                this.set_hit(1);
            } else {
                this.set_hit(hit_num);
            }
            this.setup_hit_box();
        },
        bookmark_hit() {
            let new_hits_data = _.cloneDeep(this.hits_data);
            if ("bookmark" in this.hits_data[this.current_hit - 1]) {
                new_hits_data[this.current_hit - 1].bookmark = !this.hits_data[this.current_hit - 1].bookmark
                this.set_hits_data(new_hits_data)
            } else {
                new_hits_data[this.current_hit - 1].bookmark = true
                this.set_hits_data(new_hits_data)
            }
        },
        toggle_context() {
            this.showContext = !this.showContext;
            if (this.showContext) {
                $('.context-container').hide(0);
                $('.context-container').show(300);
            } else {
                $('.context-container').show(0);
                $('.context-container').hide(300);
            }
        },
        restart_hit() {
            let new_hits_data = _.cloneDeep(this.hits_data);
            new_hits_data[this.current_hit - 1].edits = []

            // TODO: Adds a selectable edit for split sentences
            // let target_text = new_hits_data[this.current_hit - 1].target;
            // let split_signs = [...target_text.matchAll(/\|\|/gi)].map(a => a.index);
            // for (let i = 0; i < split_signs.length; i++) {
            //     split_sign = split_signs[i];
            //     new_hits_data[this.current_hit - 1].target_spans.push([2, split_sign, split_sign + 2, i]);
            // }

            this.set_hits_data(new_hits_data)
            this.refresh_interface_edit();
            this.setup_hit_box();
        },
        remove_selected(category, start, end) {
            // Essentially this just removes the span from the selected_state
            // span list and re-renders. I can use the re-rendering code already
            // written

            if (this.span_type == 'source') {
                let txt = this.hits_data[this.current_hit - 1].source
                // remove [start,end] from selected_span_in_source_indexs

                let new_span_indices = this.selected_state.source_idx
                for (let index in new_span_indices) {
                    let span = new_span_indices[index]
                    if (span[0] == start && span[1] == end) {
                        new_span_indices.splice(index, 1)
                        break
                    }
                }
                this.set_span_indices(new_span_indices, 'source');

                // this.selected_span_in_source_indexs.push([start, end]);
                let new_span_text = "";
                // iterate through this.selected_span_in_source_indexs
                for (let i = 0; i < new_span_indices.length; i++) {
                    let [start, end] = new_span_indices[i];
                    // let selected_span = new_span_text.substring(start, end);
                    new_span_text += `<span class="bg-${category}-light">\xa0`;
                    new_span_text += `<span @click="remove_selected('${category}',${start},${end})" class="hover-white black br-pill mr1 pointer">✘</span>`
                    new_span_text += txt.substring(start, end) + '\xa0';
                    new_span_text += `</span>`;
                    new_span_text += "&nbsp&nbsp";
                }
                this.set_span_text(new_span_text, 'source');
                // this.process_source_html_with_selected_span(category);
            } else if (this.span_type == 'target')  {
                let txt = this.hits_data[this.current_hit - 1].target
                // remove [start,end] from selected_span_in_target_indexs

                let new_span_indices = this.selected_state.target_idx
                for (let index in new_span_indices) {
                    let span = new_span_indices[index]
                    if (span[0] == start && span[1] == end) {
                        new_span_indices.splice(index, 1)
                        break
                    }
                }
                this.set_span_indices(new_span_indices, 'target')

                // this.selected_span_in_target_indexs.push([start, end]);
                let new_span_text = "";
                // iterate through this.selected_span_in_target_indexs
                for (let i = 0; i < new_span_indices.length; i++) {
                    let [start, end] = new_span_indices[i];
                    let selected_span = new_span_text.substring(start, end);
                    new_span_text += `<span class="bg-${category}-light">\xa0`;
                    new_span_text += `<span @click="remove_selected('${category}',${start},${end})" class="hover-white black br-pill mr1 pointer">✘</span>`
                    new_span_text += txt.substring(start, end) + '\xa0';
                    new_span_text += `</span>`;
                    new_span_text += "&nbsp&nbsp";
                }
                this.set_span_text(new_span_text, 'target');
                // this.process_target_html_with_selected_span(category);
            }
        },
        target_exists() {
            return this.hits_data && this.hits_data[this.current_hit - 1] && this.hits_data[this.current_hit - 1].target
        },
        source_exists() {
            return this.hits_data && this.hits_data[this.current_hit - 1] && this.hits_data[this.current_hit - 1].source
        },
        context_exists() {
            return this.hits_data && this.hits_data[this.current_hit - 1] && this.hits_data[this.current_hit - 1].context
        },
        showAdjacent() {
          return this.config.hasOwnProperty('display') && Object.values(this.config.display).includes('text-side-by-side') && this.source_exists() && this.target_exists()
        },
        showConfigToggle() {
          return this.config.hasOwnProperty('display') && Object.values(this.config.display).includes('hide-context') && this.context_exists()
        },
        file_download() {
            handle_file_download(this.hits_data)
        },
        async file_upload(e) {
            let new_hits_data = await handle_file_upload(e);
            this.set_hits_data(new_hits_data);
            this.set_hit(1);
            this.setup_hit_box();
        },
        async restore_progress () {
            //  Load data from firebase
            if (this.config.database && this.config.database.type && this.config.database.type == "firebase") {
                const firebaseApp = initializeApp({
                    databaseURL: this.config.database.url,
                    projectId: this.config.database.project_id,
                });

                const collection ='thresh_progress';
                const doc_id = 'annotations';
                const domain = this.config.database.domain || '';

                // Get Prolific information if it exists
                // if (this.config.crowdsource == "prolific") {
                const params = new URLSearchParams(window.location.search);
                var prolific = {
                    "completion_code": this.config.prolific_completion_code || null,
                    "cnet_id": params.get("CNET_ID") || null,
                    "exp_id": params.get("EXP_ID") || null,
                    "session_id": params.get("SESSION_ID") || null
                }
                // }

                const field_id =  domain + '_' + prolific.cnet_id;

                const db = getFirestore(firebaseApp);
                const docRef = doc(db, collection, doc_id);

                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    let document = docSnap.data();
                    let saves = document[field_id];
                    let new_hits_data = JSON.parse(saves[saves.length - 1].annotations);

                    this.set_hits_data(new_hits_data);
                    this.set_hit(1);
                    this.setup_hit_box();

                    alert("You have successfully loaded your annotations.");


                } else {
                    // docSnap.data() will be undefined in this case
                    console.log("No such document!");
                    alert("No existing saves.");
                }

                
            }

        },
        async save_progress () {
            if (this.config.database && this.config.database.type && this.config.database.type == "firebase") {
                // Send data to firebase
                const firebaseApp = initializeApp({
                    databaseURL: this.config.database.url,
                    projectId: this.config.database.project_id,
                });

                const collection = 'thresh_progress';
                const doc_id = 'annotations';
                const domain = this.config.database.domain || '';

                // Get Prolific information if it exists
                // if (this.config.crowdsource == "prolific") {
                const params = new URLSearchParams(window.location.search);
                var prolific = {
                    "completion_code": this.config.prolific_completion_code || null,
                    "cnet_id": params.get("CNET_ID") || null,
                    "exp_id": params.get("EXP_ID") || null,
                    "session_id": params.get("SESSION_ID") || null,
                }
                // }

                const field_id =  domain + '_' + prolific.cnet_id;

                const db = getFirestore(firebaseApp);
                const docRef = doc(db, collection, doc_id);

                await updateDoc(docRef, {
                    [field_id]: arrayUnion({
                        "annotations": JSON.stringify(this.hits_data, null, 2),
                        "time_submitted": new Date().toLocaleString(),
                        "prolific_metadata": JSON.stringify(prolific, null, 2),
                    })
                });

                alert("You have successfully saved your annotations.");
            }
        },
        async submit_crowsource() {
            if (this.config.database && this.config.database.type && this.config.database.type == "firebase") {
                // Send data to firebase
                const firebaseApp = initializeApp({
                    databaseURL: this.config.database.url,
                    projectId: this.config.database.project_id,
                });

                const collection = this.config.database.collection || 'thresh';
                const doc_id = this.config.database.document || 'annotations';
                const domain = this.config.database.domain || '';
                // const field_id = this.config.database.field;

                // Get Prolific information if it exists
                const params = new URLSearchParams(window.location.search);
                var prolific = {
                    "completion_code": this.config.prolific_completion_code || null,
                    "cnet_id": params.get("CNET_ID") || null,
                    "exp_id": params.get("EXP_ID") || null,
                    "session_id": params.get("SESSION_ID") || null,
                }

                const field_id =  domain + '_' + prolific.cnet_id;

                const db = getFirestore(firebaseApp);
                const docRef = doc(db, collection, doc_id);

                await updateDoc(docRef, {
                    [field_id]: arrayUnion({
                        "annotations": JSON.stringify(this.hits_data, null, 2),
                        "time_submitted": new Date().toLocaleString(),
                        "prolific_metadata": JSON.stringify(prolific, null, 2),
                    })
                });
                alert("You have successfully submitted your annotations.");
            }

            // if (this.config.crowdsource && this.config.crowdsource == "prolific") {
            //     let prolific_completion_code = this.config.prolific_completion_code;
            //     window.location.href = `https://app.prolific.co/submissions/complete?cc=${prolific_completion_code}`;
            // } else {
            //     alert("You have successfully submitted your annotations.")
            // }  
        }
    }
}
</script>

<template>
    <section id="hit">
        <div class="cf mt1 hit-header">
            <div class="tc f3 mt1 hit-selector">
                <button @click="go_to_hit(current_hit - 1)" class="mid-gray br-100 pa1 bw0 bg-near-white pointer prev-next-btns">&nbsp;&lt;&nbsp;</button>
                {{ config.interface_text.hit_box.hit_label }} <span>{{ current_hit }}</span> / <span>{{ total_hits }}&nbsp;</span>
                <button v-if="!(config.crowdsource && current_hit == total_hits)" @click="go_to_hit(current_hit + 1)" class="mid-gray br-100 pa1 bw0 bg-near-white pointer prev-next-btns">&nbsp;&gt;&nbsp;</button>
                <button v-else @click="submit_crowsource()" class="ml2 pa1 ph3 br-pill-ns ba bw1 grow pointer crowdsource-submit">Submit</button>
            </div>

            <div class="hit-instructions">
                <button v-if="config.instructions && !config.prepend_instructions" @click="toggle_instructions()" class="pa2 ph3 br-pill-ns ba bw1 grow pointer hit-instructions-btn">
                    <span class="f4">{{ config.interface_text.buttons.instructions_label }}</span>
                </button>
            </div>

            <div class="mr3 hit-browser">
                <div class="hit-browser-inner">
                    <span v-for="n in total_hits" v-bind:key="'circle-' + n" v-bind:id="'circle-' + n" v-bind:class="get_circle_class(n)" @click="go_to_hit_circle(n, $e)" class="circle pointer"><span class="tooltiptext">{{n}}</span></span>
                </div>
            </div>

            <div class="fr hit-file-buttons">
                <div class="mt1 mr2 ml2 fr" title="Restore last save">
                    <input type="button" id="upload-btn" @click="restore_progress"/>
                    <label class="file-upload br-100 w2-5 h2-5 pointer" for="upload-btn" :class="{'disabled': config.disable && Object.values(config.disable).includes('upload')}"><i class="fa fa-cloud-arrow-down"></i></label>
                </div>

                <div class="mt1 mr1 fr" title="Save progress">
                    <input type="button" id="download-btn" @click="save_progress"/>
                    <label class="file-upload file-download br-100 w2-5 h2-5 pointer" for="download-btn" :class="{'disabled': config.disable && Object.values(config.disable).includes('download')}"><i class="fa fa-cloud-arrow-up"></i></label>
                </div>
            </div>   
        </div>
        <div>
            <div class="ba b--black-80 br2 pa2">
                <div class="fr">
                    <!-- <i @click="restart_hit" class="fa-solid fa-arrows-rotate fa-lg pointer mr2"></i> -->
                    <i @click="bookmark_hit" class="bookmark fa-regular fa-bookmark fa-lg pointer ml1" :class="get_bookmark_class()"></i>
                </div>

                <p v-if="showConfigToggle()" @click="toggle_context" class="context_button pa2 br-pill-ns ba bw1 grow" :class="{'disabled': config.disable && Object.values(config.disable).includes('selection')}">
                    <div v-if="showContext">
                        <i class="fa-solid fa-arrow-up-short-wide fa-1-5x icon-default pointer mr2"></i>
                        <span class="f5">{{ config.interface_text.buttons.hide_context_label }}</span>
                    </div>
                    <div v-else>
                        <i class="fa-solid fa-arrow-down-short-wide fa-1-5x icon-default pointer mr2"></i>
                        <span class="f5">{{ config.interface_text.buttons.show_context_label }}</span>
                    </div>
                </p>

                <div class="context-container">
                    <div class="mb2" v-if="hits_data && hits_data[current_hit - 1] && hits_data[current_hit - 1].context">
                        <div class="cf" v-if="config.interface_text.typology.context_label != ''">
                            <p class="fl f3 mt1 mb1">
                                <span class="f5">{{ config.interface_text.typology.context_label }}:</span>
                            </p>
                        </div>
                        <!-- <div class="f4 lh-paras">{{ hits_data[current_hit - 1].context }}</div> -->
                        <vue-markdown :source="hits_data[current_hit - 1].context" class="mt0 mb0" />
                    </div>
                </div>

                <div class="cf" v-if="showAdjacent() && source_exists()"></div>

                <div :class="{'adjacent': showAdjacent() }">
                    <div class="grid-child">
                        <div class="cf" v-if="source_exists()">
                            <p class="fl f3 mt0 mb1 orig-sentence-header">
                                <span class="f5">{{ config.interface_text.typology.source_label }}:</span>
                            </p>
                        </div>
                        <Sent sent_type="source" v-bind="$props" :remove_selected="remove_selected" />
                    </div>

                    <div class="grid-child">
                        <p class="f3 mb1" v-if="target_exists()" :class="{'mt0': !source_exists() || showAdjacent() }">
                            <span class="f5">{{ config.interface_text.typology.target_label }}:</span>
                        </p>
                        <Sent sent_type="target" v-bind="$props" :remove_selected="remove_selected" />
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>