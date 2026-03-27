import React, { useEffect, useState } from "react";
import { fetchGroups, createGroup, startSplit } from "../services/groupApi";
import { Group } from "../types/split-group";
import { GroupList } from "../components/SplitGroup/GroupList";
import { GroupForm } from "../components/SplitGroup/GroupForm";

export default function SplitGroupPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups()
      .then((res) => {
        if (res.error) setError(res.error);
        else setGroups(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateGroup = async (name: string, members: string[]) => {
    const res = await createGroup(name, members);
    if (!res.error) setGroups([...groups, res.data]);
  };

  const handleStartSplit = async (group: Group) => {
    const res = await startSplit(group.id);
    if (!res.error) {
      // Navigate to split creation page with group members
      console.log("Split started with members:", group.members);
    }
  };

  if (loading) return <div>Loading groups...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Split Groups</h1>
      <GroupForm onCreate={handleCreateGroup} />
      <GroupList groups={groups} onSelect={handleStartSplit} />
    </div>
  );
}
