import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { BusinessData } from '../pages/Dashboard'
import { toast } from 'react-toastify'

interface UserDataRow {
  id: string
  user_id: string
  business_type: string
  file_name: string
  data: any
  mapped_columns: any
  health_score: number
  is_clean: boolean
  created_at: string
  updated_at: string
}

export const useUserData = () => {
  const { user } = useAuth()
  const [userDataList, setUserDataList] = useState<UserDataRow[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUserData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Failed to fetch your data')
        console.error('Error fetching user data:', error)
      } else {
        setUserDataList(data || [])
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveUserData = async (businessData: BusinessData) => {
    if (!user) {
      toast.error('You must be logged in to save data')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_data')
        .insert({
          user_id: user.id,
          business_type: businessData.type,
          file_name: businessData.file?.name || 'Unknown',
          data: businessData.data,
          mapped_columns: businessData.mappedColumns,
          health_score: businessData.healthScore,
          is_clean: businessData.isClean,
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to save your data')
        console.error('Error saving user data:', error)
        return null
      }

      toast.success('Data saved successfully!')
      await fetchUserData() // Refresh the list
      return data
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Error:', error)
      return null
    }
  }

  const updateUserData = async (id: string, updates: Partial<BusinessData>) => {
    if (!user) {
      toast.error('You must be logged in to update data')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_data')
        .update({
          business_type: updates.type,
          data: updates.data,
          mapped_columns: updates.mappedColumns,
          health_score: updates.healthScore,
          is_clean: updates.isClean,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        toast.error('Failed to update your data')
        console.error('Error updating user data:', error)
        return null
      }

      toast.success('Data updated successfully!')
      await fetchUserData() // Refresh the list
      return data
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Error:', error)
      return null
    }
  }

  const deleteUserData = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete data')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        toast.error('Failed to delete your data')
        console.error('Error deleting user data:', error)
        return false
      }

      toast.success('Data deleted successfully!')
      await fetchUserData() // Refresh the list
      return true
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Error:', error)
      return false
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserData()
    } else {
      setUserDataList([])
    }
  }, [user])

  return {
    userDataList,
    loading,
    saveUserData,
    updateUserData,
    deleteUserData,
    refetch: fetchUserData,
  }
}