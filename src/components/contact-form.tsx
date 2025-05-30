
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { sendContactEmail, type ContactFormInput } from "@/app/actions/send-email";

// Schema for client-side validation (server action will also validate)
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(500, { message: "Message must be less than 500 characters." }),
});

type ContactFormValues = ContactFormInput;

export default function ContactForm() {
  const { toast } = useToast();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    form.clearErrors(); 
    try {
      const result = await sendContactEmail(data);

      if (result.success) {
        toast({
          title: "Message Sent!",
          description: "Thank you for your message! I'll get back to you soon.",
        });
        form.reset();
      } else {
        let errorDescription = result.message || "An unknown error occurred.";
        if (result.error && typeof result.error === 'object' && !Array.isArray(result.error)) {
          errorDescription = "Please check your input: ";
          const fieldErrors = Object.entries(result.error as Record<string, string[]>).map(([field, messages]) => {
            const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
            form.setError(field as keyof ContactFormValues, { 
              type: "server", 
              message: messages.join(', ') 
            });
            return `${formattedField}: ${messages.join(', ')}`;
          }).join("; ");
          errorDescription += fieldErrors;
        } else if (typeof result.error === 'string') {
          errorDescription = result.error;
        }
        
        toast({
          variant: "destructive",
          title: "Message Not Sent",
          description: errorDescription,
        });
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was an unexpected problem. Please try again later.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} className="bg-input/50 border-border/70 focus:bg-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your.email@example.com" {...field} className="bg-input/50 border-border/70 focus:bg-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Your message..."
                  rows={5}
                  {...field}
                  className="bg-input/50 border-border/70 focus:bg-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-transform hover:scale-105 shadow-md" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending..." : "Send Message"} <Send className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}
