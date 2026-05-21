
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Sparkles, Loader2, Briefcase, GraduationCap } from 'lucide-react';
import { generateBioSuggestions } from '@/ai/flows/ai-bio-assistant';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const JHARKHAND_DISTRICTS = [
  "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", 
  "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", 
  "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", 
  "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"
];

export default function CreateProfile() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: '',
    district: '',
    bio: '',
    imageUrl: '',
    jobTitle: '',
    education: '',
    interests: [] as string[]
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        toast({ variant: "destructive", title: "File too large", description: "Image should be under 800KB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateBio = async () => {
    if (!profile.age || !profile.gender || !profile.district) {
      toast({ title: "Details missing", description: "Age, gender and district are needed for AI Bio." });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateBioSuggestions({
        age: parseInt(profile.age) || 18,
        gender: profile.gender,
        district: profile.district,
        desiredTone: "romantic",
        bioLength: "short"
      });
      if (result.bioSuggestions?.[0]) {
        setProfile(prev => ({ ...prev, bio: result.bioSuggestions[0] }));
      }
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to generate bio." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    if (!user) return;
    
    const ageNum = parseInt(profile.age);
    if (!profile.name || isNaN(ageNum) || !profile.district) {
      toast({ variant: "destructive", title: "Form Incomplete", description: "Name, Valid Age, and District are required." });
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const data = {
      ...profile,
      age: ageNum,
      updatedAt: serverTimestamp(),
      latitude: 23.3441, 
      longitude: 85.3091,
      isPremium: false
    };

    setDoc(userRef, data, { merge: true })
      .then(() => {
        toast({ title: "Profile Saved!", description: "Redirecting to your matches..." });
        router.push('/home');
      })
      .catch(async (e) => {
        setLoading(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: userRef.path, 
          operation: 'write',
          requestResourceData: data
        }));
      });
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-white p-6 pb-24 space-y-8 max-w-lg mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-headline font-bold text-primary">Your Profile</h1>
        <p className="text-muted-foreground">Let Jharkhand get to know you!</p>
      </div>
      
      <div className="flex flex-col items-center">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-44 h-56 rounded-[2.5rem] bg-muted border-4 border-dashed border-primary/20 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
        >
          {profile.imageUrl ? (
            <Image src={profile.imageUrl} alt="Me" fill className="object-cover" />
          ) : (
            <Camera className="w-12 h-12 text-primary/30" />
          )}
        </div>
        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoChange} />
        <span className="mt-3 text-[10px] font-bold text-primary uppercase tracking-widest">Profile Photo</span>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="rounded-xl h-12" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Age</Label>
            <Input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select onValueChange={v => setProfile({...profile, gender: v})}>
              <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Non-binary">Non-binary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>District</Label>
          <Select onValueChange={v => setProfile({...profile, district: v})}>
            <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Where do you live?" /></SelectTrigger>
            <SelectContent>
              {JHARKHAND_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Job Title</Label>
            <Input value={profile.jobTitle} onChange={e => setProfile({...profile, jobTitle: e.target.value})} placeholder="e.g. Teacher" className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Education</Label>
            <Input value={profile.education} onChange={e => setProfile({...profile, education: e.target.value})} placeholder="e.g. VBU University" className="rounded-xl h-12" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Bio</Label>
            <Button variant="ghost" size="sm" onClick={handleGenerateBio} disabled={isGenerating} className="text-primary font-bold h-7 gap-1">
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI BIO
            </Button>
          </div>
          <Textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="rounded-2xl min-h-[100px]" placeholder="Tell us your story..." />
        </div>
      </div>

      <Button onClick={handleComplete} disabled={loading} className="w-full h-14 rounded-full text-lg font-bold tinder-gradient shadow-xl">
        {loading ? <Loader2 className="animate-spin mr-2" /> : "COMPLETE PROFILE"}
      </Button>
    </div>
  );
}
