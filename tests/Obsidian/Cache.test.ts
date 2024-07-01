/**
 * @jest-environment jsdom
 */
import moment from 'moment/moment';
import type { CachedMetadata } from 'obsidian';
import { logging } from '../../src/lib/logging';
import { getTasksFromFileContent2 } from '../../src/Obsidian/Cache';
import type { ListItem } from '../../src/Task/ListItem';
import { TasksFile } from '../../src/Scripting/TasksFile';
import { inheritance_1parent1child } from './__test_data__/inheritance_1parent1child';
import { inheritance_1parent1child1newroot_after_header } from './__test_data__/inheritance_1parent1child1newroot_after_header';
import { inheritance_1parent1child1sibling_emptystring } from './__test_data__/inheritance_1parent1child1sibling_emptystring';
import { inheritance_1parent2children } from './__test_data__/inheritance_1parent2children';
import { inheritance_1parent2children1grandchild } from './__test_data__/inheritance_1parent2children1grandchild';
import { inheritance_1parent2children1sibling } from './__test_data__/inheritance_1parent2children1sibling';
import { inheritance_1parent2children2grandchildren } from './__test_data__/inheritance_1parent2children2grandchildren';
import { inheritance_1parent2children2grandchildren1sibling } from './__test_data__/inheritance_1parent2children2grandchildren1sibling';
import { inheritance_1parent2children2grandchildren1sibling_start_with_heading } from './__test_data__/inheritance_1parent2children2grandchildren1sibling_start_with_heading';
import { inheritance_2siblings } from './__test_data__/inheritance_2siblings';
import { inheritance_listitem_task } from './__test_data__/inheritance_listitem_task';
import { inheritance_listitem_task_siblings } from './__test_data__/inheritance_listitem_task_siblings';
import { inheritance_task_2listitem_3task } from './__test_data__/inheritance_task_2listitem_3task';
import { inheritance_task_listitem } from './__test_data__/inheritance_task_listitem';
import { inheritance_task_listitem_mixed_grandchildren } from './__test_data__/inheritance_task_listitem_mixed_grandchildren';
import { inheritance_task_listitem_task } from './__test_data__/inheritance_task_listitem_task';
import { inheritance_task_mixed_children } from './__test_data__/inheritance_task_mixed_children';
import { one_task } from './__test_data__/one_task';
import { callouts_nested_issue_2890_labelled } from './__test_data__/callouts_nested_issue_2890_labelled';
import { callout } from './__test_data__/callout';
import { callout_labelled } from './__test_data__/callout_labelled';
import { callout_custom } from './__test_data__/callout_custom';
import { callouts_nested_issue_2890_unlabelled } from './__test_data__/callouts_nested_issue_2890_unlabelled';
import { no_yaml } from './__test_data__/no_yaml';
import { empty_yaml } from './__test_data__/empty_yaml';
import { yaml_tags_has_multiple_values } from './__test_data__/yaml_tags_has_multiple_values';
import { yaml_custom_number_property } from './__test_data__/yaml_custom_number_property';

window.moment = moment;

function errorReporter() {
    return;
}

/* Test creation sequence:

If using this on an Obsidian version newer than the one in saved tests/Obsidian/__test_data__/*.ts
go to Settings → Files and links → Advanced → Rebuild vault cache.

- Create a sample markdown file in Tasks demo vault (root/Test Data/) with the simplest content
to represent your test case. Choose a meaningful file name in snake case. See example in 'Test Data/one_task.md'.

    - There is a Templater template that may help with creating a new file, for single-tasks cases:
      `resources/sample_vaults/Tasks-Demo/_meta/templates/Test Data file.md`

- Open any other note in the vault, just so that Templater will run.

    - The Templater plugin requires a note to be open. The script won't edit the file, so it
      doesn't matter which file you have open.

- Run the command 'Templater: Insert _meta/templates/convert_test_data_markdown_to_js.md'
    - Or type the short-cut 'Ctrl + Cmd + Alt + T' / 'Ctrl + Ctrl + Alt + T'

- This will convert all the files 'root/Test Data/*.md' to test functions in 'tests/Obsidian/__test_data__/*.ts'

- Run 'yarn lint:test-data' to standardise the formatting in the generated TypeScript files.

- Use the data in the test with `readTasksFromSimulatedFile()`, the argument is the constant you
created in the previous step.

- Remember to commit the markdown file in the demo vault and the file with the simulated data.

TODO: Make the order of values in the generated code stable.
 */

interface SimulatedFile {
    cachedMetadata: CachedMetadata;
    filePath: string;
    fileContents: string;
}

function readTasksFromSimulatedFile(testData: SimulatedFile) {
    const logger = logging.getLogger('testCache');
    return getTasksFromFileContent2(
        testData.filePath,
        testData.fileContents,
        testData.cachedMetadata.listItems!,
        logger,
        testData.cachedMetadata,
        errorReporter,
    );
}

function testRootAndChildren(root: ListItem, children: ListItem[]) {
    expect(root.parent).toEqual(null);

    testChildren(root, children);
}

function testChildren(parent: ListItem, childList: ListItem[]) {
    expect(parent.children).toEqual(childList);
    for (const child of childList) {
        expect(child.parent?.originalMarkdown).toEqual(parent.originalMarkdown);
        expect(child.parent).toEqual(parent);
    }
}

/**
 * Print a snapshot of a {@link ListItem} hierarchy based on parent-child relationships. To achieve this,
 * any indentation in {@link ListItem.originalMarkdown} will be trimmed and new indentation based
 * on parent-child relationships will be added to the snapshot.
 *
 * The type of the {@link ListItem} will be printed as well to avoid type mismatch with {@link Task}
 * since {@link Task} extends {@link ListItem}.
 *
 * @param listItem
 * @param depth of the starting tree. Set to 0 for root {@link ListItem}.
 */
function printHierarchy(listItem: ListItem, depth: number): string {
    const indentation = ' '.repeat(depth * 4);
    const trimmedMarkdown = listItem.originalMarkdown.trim();
    const type = listItem.constructor.name;

    const listItemLine = `${indentation}${trimmedMarkdown} : ${type}`;
    const childrenLines = listItem.children.map((child) => printHierarchy(child, depth + 1)).join('');

    return [listItemLine, childrenLines].join('\n');
}

/**
 * Print hierarchies from root {@link ListItem}s found in a {@link ListItem} array. A {@link ListItem} is considered
 * a root if it has no parent:
 * @example
 * ListItem.parent === null
 *
 * @param listItems
 */
function printRoots(listItems: ListItem[]) {
    let rootHierarchies = '';

    for (const listItem of listItems) {
        if (listItem.parent === null) {
            rootHierarchies += printHierarchy(listItem, 0);
        }
    }

    return rootHierarchies;
}

describe('cache - reading tasks', () => {
    it('should read one task', () => {
        const tasks = readTasksFromSimulatedFile(one_task);
        expect(tasks.length).toEqual(1);
        expect(tasks[0].description).toEqual('#task the only task here');
    });

    it('should read two sibling tasks', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_2siblings);
        expect(inheritance_2siblings.fileContents).toMatchInlineSnapshot(`
            "- [ ] #task sibling 1
            - [ ] #task sibling 2
            "
        `);

        expect(tasks.length).toEqual(2);

        const [sibling1, sibling2] = tasks;

        testRootAndChildren(sibling1, []);
        testRootAndChildren(sibling2, []);
    });

    it('should read one parent and one child task', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_1parent1child);
        expect(inheritance_1parent1child.fileContents).toMatchInlineSnapshot(`
            "- [ ] #task parent
                - [ ] #task child
            "
        `);

        expect(tasks.length).toEqual(2);

        const [parent, child] = tasks;

        testRootAndChildren(parent, [child]);
    });

    it('should read one parent and two children task', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_1parent2children);
        expect(inheritance_1parent2children.fileContents).toMatchInlineSnapshot(`
            "- [ ] #task parent
                - [ ] #task child 1
                - [ ] #task child 2
            "
        `);

        expect(tasks.length).toEqual(3);

        const [parent, child1, child2] = tasks;

        testRootAndChildren(parent, [child1, child2]);
    });

    it('should read one parent, two children and one grandchild', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_1parent2children1grandchild);
        expect(inheritance_1parent2children1grandchild.fileContents).toMatchInlineSnapshot(`
            "- [ ] #task parent task
                - [ ] #task child task 1
                - [ ] #task child task 2
                    - [ ] #task grandchild 1
            "
        `);

        expect(tasks.length).toEqual(4);

        const [parent, child1, child2, grandchild1] = tasks;

        testRootAndChildren(parent, [child1, child2]);
        testChildren(child2, [grandchild1]);
    });

    it('should read one parent, two children and two grandchildren', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_1parent2children2grandchildren);
        expect(inheritance_1parent2children2grandchildren.fileContents).toMatchInlineSnapshot(`
            "- [ ] #task parent task
                - [ ] #task child task 1
                    - [ ] #task grandchild 1
                - [ ] #task child task 2
                    - [ ] #task grandchild 2
            "
        `);

        expect(tasks.length).toEqual(5);

        const [parent, child1, grandchild1, child2, grandchild2] = tasks;

        testRootAndChildren(parent, [child1, child2]);
        testChildren(child1, [grandchild1]);
        testChildren(child2, [grandchild2]);
    });

    it('should read one parent, two children, two grandchildren and one sibling', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_1parent2children2grandchildren1sibling);
        expect(inheritance_1parent2children2grandchildren1sibling.fileContents).toMatchInlineSnapshot(`
            "- [ ] #task parent task
                - [ ] #task child task 1
                    - [ ] #task grandchild 1
                - [ ] #task child task 2
                    - [ ] #task grandchild 2
            - [ ] #task sibling
            "
        `);

        expect(tasks.length).toEqual(6);

        const [parent, child1, grandchild1, child2, grandchild2, sibling] = tasks;

        testRootAndChildren(parent, [child1, child2]);
        testChildren(child1, [grandchild1]);
        testChildren(child2, [grandchild2]);

        testRootAndChildren(sibling, []);
    });

    it('should read one parent, 2 children and a sibling', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_1parent2children1sibling);
        expect(inheritance_1parent2children1sibling.fileContents).toMatchInlineSnapshot(`
            "- [ ] #task parent
                - [ ] #task child 1
                - [ ] #task child 2
            - [ ] #task sibling
            "
        `);

        expect(tasks.length).toEqual(4);

        const [parent, child1, child2, sibling] = tasks;

        testRootAndChildren(parent, [child1, child2]);
        testRootAndChildren(sibling, []);
    });

    it('should read sibling separated by empty line', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_1parent1child1sibling_emptystring);
        expect(inheritance_1parent1child1sibling_emptystring.fileContents).toMatchInlineSnapshot(`
            "- [ ] #task parent task
                - [ ] #task child task 1

             - [ ] #task sibling
            "
        `);

        expect(tasks.length).toEqual(3);

        const [parent, child, sibling] = tasks;

        testRootAndChildren(parent, [child]);
        testChildren(child, []);

        testRootAndChildren(sibling, []);
    });

    it('should read new root task after header', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_1parent1child1newroot_after_header);
        expect(inheritance_1parent1child1newroot_after_header.fileContents).toMatchInlineSnapshot(`
            "# first header

            - [ ] #task parent task
                - [ ] #task child task 1

            ## second header

            - [ ] #task root task
            "
        `);

        expect(tasks.length).toEqual(3);

        const [parent, child, newRoot] = tasks;

        testRootAndChildren(parent, [child]);
        testChildren(child, []);

        testRootAndChildren(newRoot, []);
    });

    it('should read root on non-starting line', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_1parent2children2grandchildren1sibling_start_with_heading);
        expect(inheritance_1parent2children2grandchildren1sibling_start_with_heading.fileContents)
            .toMatchInlineSnapshot(`
            "# Test heading

            - [ ] #task parent task
                - [ ] #task child task 1
                    - [ ] #task grandchild 1
                - [ ] #task child task 2
                    - [ ] #task grandchild 2
            - [ ] #task sibling
            "
        `);

        expect(tasks.length).toEqual(6);

        const [parent, child1, grandchild1, child2, grandchild2, sibling] = tasks;

        testRootAndChildren(parent, [child1, child2]);
        testChildren(child1, [grandchild1]);
        testChildren(child2, [grandchild2]);

        testRootAndChildren(sibling, []);
    });

    it('should read task and listItem siblings', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_listitem_task_siblings);
        expect(inheritance_listitem_task_siblings.fileContents).toMatchInlineSnapshot(`
            "- list item
            - [ ] task
            "
        `);

        expect(tasks.length).toEqual(1);

        const [task] = tasks;

        testRootAndChildren(task, []);
    });

    it('should read child task and parent listItem', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_listitem_task);
        expect(inheritance_listitem_task.fileContents).toMatchInlineSnapshot(`
            "- parent list item
                - [ ] child task
            "
        `);

        expect(tasks.length).toEqual(1);

        expect(printRoots(tasks)).toMatchInlineSnapshot(`
            "- [ ] child task : Task
            "
        `);
    });

    it('should read parent task and child listItem', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_task_listitem);
        expect(inheritance_task_listitem.fileContents).toMatchInlineSnapshot(`
            "- [ ] parent task
                - child list item
            "
        `);

        expect(tasks.length).toEqual(1);

        expect(printRoots(tasks)).toMatchInlineSnapshot(`
            "- [ ] parent task : Task
                - child list item : ListItem
            "
        `);
    });

    it('should read parent task, child listItem and grandchild task', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_task_listitem_task);
        expect(inheritance_task_listitem_task.fileContents).toMatchInlineSnapshot(`
            "- [ ] parent task
                - child list item
                    - [ ] grandchild task
            "
        `);

        expect(tasks.length).toEqual(2);

        expect(printRoots(tasks)).toMatchInlineSnapshot(`
            "- [ ] parent task : Task
                - child list item : ListItem
                    - [ ] grandchild task : Task
            "
        `);
    });

    it('should read parent task, two child listItems and 3 grandchild tasks', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_task_2listitem_3task);
        expect(inheritance_task_2listitem_3task.fileContents).toMatchInlineSnapshot(`
            "- [ ] parent task
                - child list item 1
                    - [ ] grandchild task 1
                    - [ ] grandchild task 2
                - child list item 2
                    - [ ] grandchild task 3
            "
        `);

        expect(tasks.length).toEqual(4);

        expect(printRoots(tasks)).toMatchInlineSnapshot(`
            "- [ ] parent task : Task
                - child list item 1 : ListItem
                    - [ ] grandchild task 1 : Task
                    - [ ] grandchild task 2 : Task
                - child list item 2 : ListItem
                    - [ ] grandchild task 3 : Task
            "
        `);
    });

    it('should read parent task with mixed children', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_task_mixed_children);
        expect(inheritance_task_mixed_children.fileContents).toMatchInlineSnapshot(`
            "- [ ] parent task
                - [ ] child task 1
                - child list item 1
                - [ ] child task 2
            "
        `);

        expect(tasks.length).toEqual(3);

        expect(printRoots(tasks)).toMatchInlineSnapshot(`
            "- [ ] parent task : Task
                - [ ] child task 1 : Task
                - child list item 1 : ListItem
                - [ ] child task 2 : Task
            "
        `);
    });

    it('should read parent task and child list item with mixed children', () => {
        const tasks = readTasksFromSimulatedFile(inheritance_task_listitem_mixed_grandchildren);
        expect(inheritance_task_listitem_mixed_grandchildren.fileContents).toMatchInlineSnapshot(`
            "- [ ] parent task
                - child list item
                    - grandchild list item 1
                    - [ ] grandchild task
                    - grandchild list item 2
            "
        `);

        expect(tasks.length).toEqual(2);

        expect(printRoots(tasks)).toMatchInlineSnapshot(`
            "- [ ] parent task : Task
                - child list item : ListItem
                    - grandchild list item 1 : ListItem
                    - [ ] grandchild task : Task
                    - grandchild list item 2 : ListItem
            "
        `);
    });

    it('callout', () => {
        const tasks = readTasksFromSimulatedFile(callout);
        expect(callout.fileContents).toMatchInlineSnapshot(`
            "# callout

            > [!todo]
            > - [ ] #task Task in 'callout'
            >     - [ ] #task Task indented in 'callout'

            \`\`\`tasks
            not done
            path includes {{query.file.path}}
            \`\`\`
            "
        `);
        expect(printRoots(tasks)).toMatchInlineSnapshot(`
            "> - [ ] #task Task in 'callout' : Task
                >     - [ ] #task Task indented in 'callout' : Task
            "
        `);
        expect(tasks.length).toEqual(2);
    });

    it('callout_custom', () => {
        const tasks = readTasksFromSimulatedFile(callout_custom);
        expect(callout_custom.fileContents).toMatchInlineSnapshot(`
            "# callout_custom

            > [!callout_custom]
            > - [ ] #task Task in 'callout_custom'
            >     - [ ] #task Task indented in 'callout_custom'

            \`\`\`tasks
            not done
            path includes {{query.file.path}}
            \`\`\`
            "
        `);
        expect(printRoots(tasks)).toMatchInlineSnapshot(`
            "> - [ ] #task Task in 'callout_custom' : Task
                >     - [ ] #task Task indented in 'callout_custom' : Task
            "
        `);
        expect(tasks.length).toEqual(2);
    });

    it('callout_labelled', () => {
        const tasks = readTasksFromSimulatedFile(callout_labelled);
        expect(callout_labelled.fileContents).toMatchInlineSnapshot(`
            "# callout_labelled

            > [!todo] callout_labelled
            > - [ ] #task Task in 'callout_labelled'
            >     - [ ] #task Task indented in 'callout_labelled'

            \`\`\`tasks
            not done
            path includes {{query.file.path}}
            \`\`\`
            "
        `);
        expect(printRoots(tasks)).toMatchInlineSnapshot(`
            "> - [ ] #task Task in 'callout_labelled' : Task
                >     - [ ] #task Task indented in 'callout_labelled' : Task
            "
        `);
        expect(tasks.length).toEqual(2);
    });

    it('callouts_nested_issue_2890_unlabelled', () => {
        const tasks = readTasksFromSimulatedFile(callouts_nested_issue_2890_unlabelled);
        expect(callouts_nested_issue_2890_unlabelled.fileContents).toMatchInlineSnapshot(`
            " > [!Calendar]+
             >> [!Check]+
             >>> [!Attention]+
             >>> Some stuff goes here
             >>> - [ ] #task Correction1
             >>> - [ ] #task Correction2
             >>> - [ ] #task Correction3
             >>> - [ ] #task Correction4

            \`\`\`tasks
            not done
            path includes {{query.file.path}}
            \`\`\`
            "
        `);
        expect(printRoots(tasks)).toMatchInlineSnapshot(`
            ">>> - [ ] #task Correction1 : Task
            >>> - [ ] #task Correction2 : Task
            >>> - [ ] #task Correction3 : Task
            >>> - [ ] #task Correction4 : Task
            "
        `);
        expect(tasks.length).toEqual(4);
    });

    it('callouts_nested_issue_2890_labelled', () => {
        const tasks = readTasksFromSimulatedFile(callouts_nested_issue_2890_labelled);
        expect(callouts_nested_issue_2890_labelled.fileContents).toMatchInlineSnapshot(`
            " > [!Calendar]+ MONTH
             >> [!Check]+ GROUP
             >>> [!Attention]+ Correction TITLE
             >>> Some stuff goes here
             >>> - [ ] #task Correction1
             >>> - [ ] #task Correction2
             >>> - [ ] #task Correction3
             >>> - [ ] #task Correction4

            \`\`\`tasks
            not done
            path includes {{query.file.path}}
            \`\`\`
            "
        `);
        expect(printRoots(tasks)).toMatchInlineSnapshot(`
            ">>> - [ ] #task Correction1 : Task
            >>> - [ ] #task Correction2 : Task
            >>> - [ ] #task Correction3 : Task
            >>> - [ ] #task Correction4 : Task
            "
        `);
        expect(tasks.length).toEqual(4);
    });
});

describe('cache - reading frontmatter', () => {
    it('should read file if not given CachedMetadata', () => {
        const tasksFile = new TasksFile('some path.md', {});

        expect(tasksFile.cachedMetadata.frontmatter).toBeUndefined();
        expect(tasksFile.frontMatter).toEqual({});
    });

    it('should read file with no yaml metadata', () => {
        const data = no_yaml;
        const cachedMetadata = data.cachedMetadata as any as CachedMetadata;
        const tasksFile = new TasksFile(data.filePath, cachedMetadata);

        expect(tasksFile.cachedMetadata.frontmatter).toBeUndefined();
        expect(tasksFile.frontMatter).toEqual({});
    });

    it('should read file with empty yaml metadata', () => {
        const data = empty_yaml;
        const cachedMetadata = data.cachedMetadata as any as CachedMetadata;
        const tasksFile = new TasksFile(data.filePath, cachedMetadata);

        expect(tasksFile.cachedMetadata.frontmatter).toBeUndefined();
        expect(tasksFile.frontMatter).toEqual({});
    });

    it('should read file with multiple tags in yaml metadata', () => {
        const data = yaml_tags_has_multiple_values;
        const cachedMetadata = data.cachedMetadata as any as CachedMetadata;
        const tasksFile = new TasksFile(data.filePath, cachedMetadata);

        expect(tasksFile.cachedMetadata.frontmatter?.tags).toEqual(['multiple1', 'multiple2']);
        expect(tasksFile.frontMatter.tags).toEqual(['multiple1', 'multiple2']);
    });

    // See property types: https://help.obsidian.md/Editing+and+formatting/Properties#Property+types
    // Obsidian supports the following property types:
    //  Text
    //  List
    //  Number
    //  Checkbox
    //  Date
    //  Date & time
    it('should read file with custom number property', () => {
        const data = yaml_custom_number_property;
        const cachedMetadata = data.cachedMetadata as any as CachedMetadata;
        const tasksFile = new TasksFile(data.filePath, cachedMetadata);

        expect(tasksFile.frontMatter?.custom_number_prop).toEqual(42);
    });
});
