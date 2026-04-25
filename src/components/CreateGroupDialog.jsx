import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const CreateGroupDialog = ({ isOpen, setIsOpen, onGroupCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchProfiles = async () => {
        const { data, error } = await supabase.from('profiles').select('*').neq('id', user.id);
        if (!error) setProfiles(data);
      };
      fetchProfiles();
      // Reset state on open
      setGroupName('');
      setSelectedMembers([]);
    }
  }, [isOpen, user.id]);

  const handleMemberToggle = (profileId) => {
    setSelectedMembers(prev =>
      prev.includes(profileId) ? prev.filter(id => id !== profileId) : [...prev, profileId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({ title: 'Error', description: 'El nombre del grupo no puede estar vacío.', variant: 'destructive' });
      return;
    }
    if (selectedMembers.length === 0) {
      toast({ title: 'Error', description: 'Debes seleccionar al menos un miembro.', variant: 'destructive' });
      return;
    }

    // 1. Create conversation
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert({ is_group: true, group_name: groupName })
      .select()
      .single();

    if (convError) {
      toast({ title: 'Error', description: 'No se pudo crear el grupo.', variant: 'destructive' });
      return;
    }

    // 2. Add members
    const memberIds = [user.id, ...selectedMembers];
    const memberInsert = memberIds.map(memberId => ({
      conversation_id: convData.id,
      user_id: memberId,
    }));

    const { error: memberError } = await supabase.from('conversation_members').insert(memberInsert);

    if (memberError) {
      toast({ title: 'Error', description: 'No se pudieron añadir miembros al grupo.', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: `Grupo "${groupName}" creado.` });
      onGroupCreated();
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glass-effect text-white">
        <DialogHeader>
          <DialogTitle className="gradient-text">Crear Nuevo Grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="groupName">Nombre del Grupo</Label>
            <Input id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="mt-1 bg-slate-800 border-slate-700" />
          </div>
          <div>
            <Label>Miembros</Label>
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-800/50 rounded-md">
              {profiles.map(profile => (
                <div
                  key={profile.id}
                  onClick={() => handleMemberToggle(profile.id)}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${selectedMembers.includes(profile.id) ? 'bg-blue-500/50' : 'hover:bg-slate-700'}`}
                >
                  <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} alt={profile.username} className="w-8 h-8 rounded-full" />
                  <span>{profile.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateGroup} className="bg-gradient-to-r from-blue-500 to-purple-600">Crear Grupo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;