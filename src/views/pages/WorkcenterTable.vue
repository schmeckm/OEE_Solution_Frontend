<script setup>
import { ref, onMounted } from 'vue';
import WorkCenterService from '@/service/WorkCenterService';

const treeTableValue = ref([]); // Data for TreeTable
const selectedTreeTableValue = ref(null); // Selected nodes
const loadingTopics = ref(false); // Loading state
const expandedKeys = ref({}); // Store expanded nodes

// Function to build the correct hierarchical structure
const buildHierarchy = (topics) => {
    const root = {};

    topics.forEach((topic) => {
        const parts = topic.split('/'); // Split the topic into segments

        let current = root; // Start at the root
        parts.forEach((part, index) => {
            const isMachine = index === 3; // Detect machine names at the 4th position (0-based index)

            if (isMachine) {
                // Machines like Falcon11 are directly added as nodes
                if (!current[part]) {
                    current[part] = {
                        data: {
                            name: part,
                            type: 'Machine', // Label machines as Machine
                        },
                        children: {},
                    };
                }
                current = current[part].children; // Move into the machine's children
            } else {
                if (!current[part]) {
                    current[part] = {
                        data: {
                            name: part,
                            type: index === parts.length - 1 ? 'Detail' : 'Node', // Last segment is Detail, others are Node
                        },
                        children: {},
                    };
                }
                current = current[part].children; // Move deeper in the hierarchy
            }
        });
    });

    // Recursive function to convert the nested object into TreeTable format
    const convertToTreeTable = (node) => {
        return Object.entries(node).map(([key, value]) => ({
            key: key,
            data: value.data,
            children: value.children ? convertToTreeTable(value.children) : null,
        }));
    };

    return convertToTreeTable(root);
};

// Function to expand all nodes
const expandAll = () => {
    const expandAllNodes = (nodes) => {
        const keys = {};
        nodes.forEach((node) => {
            keys[node.key] = true;
            if (node.children) {
                Object.assign(keys, expandAllNodes(node.children));
            }
        });
        return keys;
    };
    expandedKeys.value = expandAllNodes(treeTableValue.value);
};

// Function to collapse all nodes
const collapseAll = () => {
    expandedKeys.value = {};
};

// Fetch topics and build the hierarchical structure
const fetchTopics = async () => {
    loadingTopics.value = true;
    try {
        const topics = await WorkCenterService.getTopics();
        treeTableValue.value = buildHierarchy(topics);
    } catch (error) {
        console.error('Error fetching topics:', error.message);
    } finally {
        loadingTopics.value = false;
    }
};

// Fetch topics on component mount
onMounted(() => {
    fetchTopics();
});
</script>

<template>
    <div>
        <h4 class="mb-4">Hierarchical Topics</h4>
        <div class="flex gap-4 mb-4">
            <Button label="Expand All" icon="pi pi-plus" @click="expandAll" />
            <Button label="Collapse All" icon="pi pi-minus" @click="collapseAll" />
        </div>
        <TreeTable
            :value="treeTableValue"
            selectionMode="checkbox"
            v-model:selectionKeys="selectedTreeTableValue"
            :expandedKeys="expandedKeys"
            @update:expandedKeys="(e) => (expandedKeys.value = e)"
            :loading="loadingTopics"
            paginator
            :rows="10"
        >
            <Column field="name" header="Name" :expander="true"></Column>
            <Column field="type" header="Type"></Column>
        </TreeTable>
    </div>
</template>
