import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useNavigate } from 'react-router-dom'

const FacebookSetup = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [selectedAccount, setSelectedAccount] = useState(null)

  // 1. Fetch the user's ad accounts
  const { data: adAccounts, isLoading, error } = useQuery({
    queryKey: ['facebookAdAccounts'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/functions/v1/get-facebook-ad-accounts', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!response.ok) throw new Error('Failed to fetch ad accounts')
      const { data } = await response.json()
      return data
    },
  })

  // 2. Mutation to save the selected ad account
  const saveAccountMutation = useMutation({
    mutationFn: async (accountId) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('user_credentials')
        .update({ provider_specific_id: accountId })
        .eq('user_id', user.id)
        .eq('provider', 'facebook')

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      navigate('/integrations')
    },
  })

  const handleSubmit = () => {
    if (selectedAccount) {
      saveAccountMutation.mutate(selectedAccount)
    }
  }

  return (
    <section className="space-y-6">
      <Card className="mx-auto max-w-lg shadow-elevated">
        <CardHeader>
          <CardTitle>Connect Facebook Ad Account</CardTitle>
          <CardDescription>
            Choose the ad account you want to sync with our dashboard. We'll pull in campaign data from this account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading your ad accounts...</p>}
          {error && <p className="text-destructive">Error: {error.message}</p>}
          {adAccounts && (
            <RadioGroup onValueChange={setSelectedAccount} className="space-y-2">
              {adAccounts.map((account) => (
                <div key={account.account_id} className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value={account.account_id} id={account.account_id} />
                  <Label htmlFor={account.account_id} className="flex-1 cursor-pointer">
                    <span className="font-medium">{account.name}</span>
                    <p className="text-sm text-muted-foreground">{account.account_id}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!selectedAccount || saveAccountMutation.isPending}
            className="mt-6 w-full"
          >
            {saveAccountMutation.isPending ? 'Saving...' : 'Save and Continue'}
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}

export default FacebookSetup
